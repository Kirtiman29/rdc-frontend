import axios from "axios";
import { applyIndustrialInterceptors, getAssetUrl, getToken } from "./apiClient";
import { getMyCredits } from "./subscriptionApi";
import { generateGeminiImageToImage as generateGeminiImageToImageRequest } from "./imageToImageApi";
import { fetchHistory } from "./historyApi";
import { createApiUrl, serviceOrigins } from "./serviceConfig";

const ADMIN_SERVICE_URL = (
  import.meta.env.VITE_ADMIN_SERVICE_URL ||
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

const GEMINI_IMAGE_OUTPUT_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_AI_SERVICE_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

const AI_SERVICE_URL = (import.meta.env.VITE_AI_SERVICE_URL || "").replace(/\/+$/, "");
const GPU_SERVICE_URL = (
  import.meta.env.VITE_GPU_SERVICE_URL ||
  import.meta.env.VITE_UPSCALE_SERVICE_URL ||
  "http://localhost:8004"
).replace(/\/+$/, "");
const USE_DIRECT_GPU_UPSCALE = import.meta.env.VITE_USE_DIRECT_GPU_UPSCALE !== "false";
const ENABLE_UPSCALE_PROXY_FALLBACK = import.meta.env.VITE_UPSCALE_PROXY_FALLBACK === "true";

const ASSET_SERVICE_URL = (
  import.meta.env.VITE_ASSET_SERVICE_URL ||
  import.meta.env.VITE_BASE_URL ||
  ""
).replace(/\/+$/, "");
const normalizeEndpoint = (value: string) =>
  value.replace(/([^:]\/)\/+/g, "$1").replace(/\/+$/, "");

const DEFAULT_AI_INPUT_UPLOAD_ENDPOINT = createApiUrl(serviceOrigins.asset, "assets/ai-upload");
const AI_INPUT_UPLOAD_ENDPOINT = normalizeEndpoint(
  import.meta.env.VITE_AI_INPUT_UPLOAD_ENDPOINT || DEFAULT_AI_INPUT_UPLOAD_ENDPOINT
);
const AI_INPUT_UPLOAD_ENDPOINTS = [AI_INPUT_UPLOAD_ENDPOINT, DEFAULT_AI_INPUT_UPLOAD_ENDPOINT]
  .filter(Boolean)
  .map(normalizeEndpoint)
  .filter((value, index, items) => items.indexOf(value) === index);

const AI_USE_BASE_URL = createApiUrl(serviceOrigins.admin, "ai");
const SEAMLESS_PATTERN_TOOL_NAME = (import.meta.env.VITE_SEAMLESS_PATTERN_TOOL_NAME || "SEAMLESS_PATTERN").trim();
const LEGACY_SEAMLESS_PATTERN_ENDPOINT = (
  import.meta.env.VITE_SEAMLESS_PATTERN_ENDPOINT || "/pattern/generate-seamless"
).trim();
const IS_DEV = import.meta.env.DEV;

export const AI_CREDITS_UPDATED_EVENT = "ai-credits-updated";
export const GEMINI_GENERATION_ASPECT_RATIOS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
] as const;
export const GEMINI_IMAGE_MIX_ASPECT_RATIOS = [
  "1:1",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
] as const;
export const GEMINI_IMAGE_TO_IMAGE_ASPECT_RATIOS = [
  "auto",
  ...GEMINI_GENERATION_ASPECT_RATIOS,
] as const;

export const aiStudioApi = axios.create({
  baseURL: AI_USE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

applyIndustrialInterceptors(aiStudioApi);

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isLikelyUrl = (value: string) =>
  /^(https?:\/\/|data:|blob:|\/)/i.test(value) || value.includes(".");

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const tryParseJsonRecord = (value: unknown): UnknownRecord | null => {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const trimmedValue = value.trim();
  if (
    (!trimmedValue.startsWith("{") || !trimmedValue.endsWith("}")) &&
    (!trimmedValue.startsWith("[") || !trimmedValue.endsWith("]"))
  ) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(trimmedValue);
    return isRecord(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
};

const joinUrl = (baseUrl: string, path: string) => {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/\\/g, "/");
  const cleanPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  return `${cleanBase}${cleanPath}`;
};

const getUrlPath = (url: string) => {
  try {
    return new URL(url, "http://placeholder.local").pathname;
  } catch {
    return url.split(/[?#]/)[0];
  }
};

const isAssetDownloadUrl = (url: string) =>
  /\/api\/assets\/download\/[^/?#]+/i.test(getUrlPath(url));

const isLocalOrPrivateHost = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "host.docker.internal" ||
  /^192\.168\./.test(hostname) ||
  /^10\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

const rewriteLegacyAiHost = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    if (isLocalOrPrivateHost(parsedUrl.hostname)) {
      const localOrigin =
        parsedUrl.hostname === "host.docker.internal" ?
          `${parsedUrl.protocol}//localhost${parsedUrl.port ? `:${parsedUrl.port}` : ""}`
        : parsedUrl.origin;
      return joinUrl(AI_SERVICE_URL || localOrigin, `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`);
    }
  } catch {
    // Ignore malformed URLs and fall back to the default logic below.
  }

  return url;
};

const shouldUseAiServiceForOutput = (url: string) =>
  Boolean(AI_SERVICE_URL) &&
  /^(?:patterns|output|files(?:\/|$)|static(?:\/|$)|storage(?:\/|$)|mixed-images(?:\/|$)|gemini-generated(?:\/|$)|embroidery(?:\/|$)|random-placement-files(?:\/|$))/i.test(
    getUrlPath(url).replace(/^\/+/, "")
  );

const normalizeAiServiceOutputUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url, "http://placeholder.local");
    return joinUrl(AI_SERVICE_URL, `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`);
  } catch {
    return joinUrl(AI_SERVICE_URL, url);
  }
};

const normalizeAiOutputUrlFromBase = (baseUrl: string, url?: string | null) => {
  if (!url) return "";
  if (/^(data:|blob:)/i.test(url)) return url;
  if (shouldUseAiServiceForOutput(url)) return normalizeAiServiceOutputUrl(url);
  if (/^https?:\/\//i.test(url)) return rewriteLegacyAiHost(url);
  return joinUrl(baseUrl, url);
};

const toNumber = (value: FormDataEntryValue | null, fallback: number) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const readUrlsFromValue = (value: unknown, urls: string[]) => {
  if (!value) return;

  if (typeof value === "string") {
    const parsedJson = tryParseJsonRecord(value);
    if (parsedJson) {
      readUrlsFromValue(parsedJson, urls);
      return;
    }

    if (isLikelyUrl(value)) {
      urls.push(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => readUrlsFromValue(item, urls));
    return;
  }

  if (!isRecord(value)) return;

  const directKeys = [
    "outputUrl",
    "output_url",
    "output_image",
    "url",
    "image",
    "image_url",
    "preview_url",
    "final_image_url",
    "reconstructed_preview",
    "original_image",
  ];

  const nestedKeys = [
    "generated_images",
    "generatedImages",
    "image_urls",
    "imageUrls",
    "outputUrls",
    "output_urls",
    "images",
    "results",
    "items",
    "data",
    "outputs",
  ];

  directKeys.forEach((key) => {
    if (typeof value[key] === "string") {
      urls.push(value[key] as string);
    }
  });

  nestedKeys.forEach((key) => {
    if (key in value) {
      readUrlsFromValue(value[key], urls);
    }
  });
};

const extractUploadedAssetUrl = (payload: unknown): string => {
  if (typeof payload === "string") {
    if (isAssetDownloadUrl(payload)) {
      return getAssetUrl(payload);
    }
    if (/^(https?:\/\/|data:|blob:)/i.test(payload)) {
      return payload;
    }
    return joinUrl(ASSET_SERVICE_URL || ADMIN_SERVICE_URL, payload);
  }

  if (!isRecord(payload)) {
    throw new Error("Image upload response is invalid.");
  }

  const directUrlKeys = [
    "url",
    "fileUrl",
    "assetUrl",
    "downloadUrl",
    "publicUrl",
    "location",
    "path",
  ];

  for (const key of directUrlKeys) {
    const value = payload[key];
    if (typeof value === "string" && value) {
      if (isAssetDownloadUrl(value)) {
        return getAssetUrl(value);
      }
      if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
        return value;
      }
      return joinUrl(ASSET_SERVICE_URL || ADMIN_SERVICE_URL, value);
    }
  }

  const uuidKeys = ["assetUuid", "uuid", "id"];
  for (const key of uuidKeys) {
    const value = payload[key];
    if (typeof value === "string" && value) {
      return getAssetUrl(value);
    }
  }

  const nestedKeys = ["data", "result", "payload"];
  for (const key of nestedKeys) {
    if (key in payload) {
      try {
        return extractUploadedAssetUrl(payload[key]);
      } catch {
        // Try next candidate.
      }
    }
  }

  throw new Error(
    "Image upload succeeded but the frontend could not find a usable hosted URL in the upload response."
  );
};

const AI_ASSET_URL_PARAM_KEYS = new Set([
  "inputUrl",
  "input_url",
  "inputUrls",
  "input_urls",
  "imageUrl",
  "image_url",
  "imageUrls",
  "image_urls",
  "referenceUrl",
  "reference_url",
  "referenceUrls",
  "reference_urls",
  "referenceImages",
  "reference_images",
  "sourceUrl",
  "source_url",
  "sourceUrls",
  "source_urls",
  "maskFile",
  "mask_file",
  "fileUrl",
  "file_url",
  "assetUrl",
  "asset_url",
  "downloadUrl",
  "download_url",
]);

const normalizeAiAssetDownloadUrl = (value: string) => {
  if (isAssetDownloadUrl(value)) {
    return getAssetUrl(value);
  }

  return value;
};

const normalizeAiAssetUrlValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return normalizeAiAssetDownloadUrl(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeAiAssetUrlValue(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      AI_ASSET_URL_PARAM_KEYS.has(key) ? normalizeAiAssetUrlValue(item) : item,
    ])
  );
};

const normalizeAiToolPayloadAssetUrls = (payload: AiToolPayload): AiToolPayload => ({
  ...payload,
  inputUrl:
    typeof payload.inputUrl === "string" ?
      normalizeAiAssetDownloadUrl(payload.inputUrl)
    : payload.inputUrl,
  params: Object.fromEntries(
    Object.entries(payload.params || {}).map(([key, value]) => [
      key,
      AI_ASSET_URL_PARAM_KEYS.has(key) ? normalizeAiAssetUrlValue(value) : value,
    ])
  ),
});

type GeneratedImagePayload = {
  filename?: string;
  image_url?: string;
  imageUrl?: string;
  url?: string;
};

type ExtractedGeneratedImage = {
  filename: string;
  url: string;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isNonEmptyString)
    .map((item) => item.trim());
};

const extractGeneratedImagesFromOutputData = (outputData: unknown): ExtractedGeneratedImage[] => {
  const normalizedOutputData = isRecord(outputData) ? outputData : tryParseJsonRecord(outputData);

  if (!normalizedOutputData) {
    return [];
  }

  const generatedImages = Array.isArray(normalizedOutputData.generated_images)
    ? normalizedOutputData.generated_images
    : Array.isArray(normalizedOutputData.generatedImages)
      ? normalizedOutputData.generatedImages
      : [];

  const urlsFromObjects = generatedImages
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const generatedImage = item as GeneratedImagePayload;
      const rawUrl = generatedImage.image_url || generatedImage.imageUrl || generatedImage.url;

      if (!isNonEmptyString(rawUrl)) {
        return null;
      }

      return {
        filename:
          isNonEmptyString(generatedImage.filename) ?
            generatedImage.filename.trim()
          : `generated-${index + 1}.png`,
        url: normalizeAiOutputUrl(rawUrl.trim()),
      };
    })
    .filter((item): item is ExtractedGeneratedImage => Boolean(item));

  if (urlsFromObjects.length > 0) {
    return urlsFromObjects;
  }

  const normalizedUrlsFromArray = normalizeStringArray(
    Array.isArray(normalizedOutputData.image_urls) ?
      normalizedOutputData.image_urls
    : normalizedOutputData.imageUrls
  );

  return normalizedUrlsFromArray.map((url, index) => ({
    filename: `generated-${index + 1}.png`,
    url: normalizeAiOutputUrl(url),
  }));
};

const dedupeGeneratedImages = (images: ExtractedGeneratedImage[]) => {
  const seenUrls = new Set<string>();
  return images.filter((image) => {
    if (!image.url || seenUrls.has(image.url)) {
      return false;
    }

    seenUrls.add(image.url);
    return true;
  });
};

const extractGeneratedImages = (
  response: Pick<AiToolResponse, "outputUrl" | "outputData">
): ExtractedGeneratedImage[] => {
  const preferredImages = dedupeGeneratedImages(
    extractGeneratedImagesFromOutputData(response.outputData)
  );

  if (preferredImages.length > 0) {
    return preferredImages;
  }

  const urls: string[] = [];
  readUrlsFromValue(response.outputData, urls);

  if (response.outputUrl) {
    urls.push(response.outputUrl);
  }

  return [...new Set(urls.map((url) => normalizeAiOutputUrl(url)).filter(Boolean))].map(
    (url, index) => ({
      filename: `generated-${index + 1}.png`,
      url,
    })
  );
};

export const extractGeneratedImageUrls = (
  response: Pick<AiToolResponse, "outputUrl" | "outputData">
) => extractGeneratedImages(response).map((image) => image.url);

const extractOutputUrls = (response: AiToolResponse) => {
  return extractGeneratedImageUrls(response);
};

const readErrorMessage = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.message === "string" && value.message.trim()) {
    return value.message.trim();
  }

  if (typeof value.error === "string" && value.error.trim()) {
    return value.error.trim();
  }

  if (typeof value.detail === "string" && value.detail.trim()) {
    return value.detail.trim();
  }

  if (Array.isArray(value.errors) && value.errors.length > 0) {
    const message = value.errors
      .map((item) => readErrorMessage(item))
      .filter((item): item is string => Boolean(item))
      .join(", ");

    if (message) {
      return message;
    }
  }

  return null;
};

export const getAiErrorMessage = (
  error: unknown,
  fallback = "The AI request could not be completed."
) => {
  if (axios.isAxiosError(error)) {
    const backendMessage = readErrorMessage(error.response?.data);
    if (backendMessage) {
      return backendMessage;
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message.trim();
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
};

const getUploadErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const backendMessage = readErrorMessage(error.response?.data);
    const endpoint = error.config?.baseURL || error.config?.url || "unknown endpoint";

    if (backendMessage) {
      return `AI input upload failed at ${endpoint}: ${backendMessage}`;
    }

    if (error.message) {
      return `AI input upload failed at ${endpoint}: ${error.message}`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "AI input upload failed before the image could be sent to the backend.";
};

const createAiAssetUploadApi = (endpoint: string) => {
  const instance = axios.create({
    baseURL: endpoint,
  });

  applyIndustrialInterceptors(instance);
  return instance;
};

const getUploadFallbackEligibility = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return { shouldTryNext: false, shouldPreserveAsPrimary: false };
  }

  const status = error.response?.status || 0;

  if (status === 404) {
    return { shouldTryNext: true, shouldPreserveAsPrimary: false };
  }

  if (status === 405 || status === 415) {
    return { shouldTryNext: true, shouldPreserveAsPrimary: true };
  }

  return { shouldTryNext: false, shouldPreserveAsPrimary: true };
};

const dispatchCreditsUpdated = (remainingCredits?: number | null) => {
  if (typeof window === "undefined" || typeof remainingCredits !== "number") return;

  window.dispatchEvent(
    new CustomEvent<number>(AI_CREDITS_UPDATED_EVENT, {
      detail: remainingCredits,
    })
  );
};

export type BuiltInAiToolName =
  | "PROMPT_ENHANCER"
  | "UPSCALE"
  | "TEXTILE_GENERATOR"
  | "IMAGE_TO_IMAGE"
  | "GEMINI_TEXT_TO_IMAGE"
  | "GEMINI_IMAGE_TO_IMAGE"
  | "GEMINI_IMAGE_MIX"
  | "IMAGE_MIX"
  | "COLORWAY"
  | "COLOR_SEPARATION"
  | "SEAMLESS_PATTERN";

export type AiToolName = BuiltInAiToolName | (string & {});
export type GeminiGenerationAspectRatio =
  (typeof GEMINI_GENERATION_ASPECT_RATIOS)[number];
export type TextToImageProvider = "gemini" | "gpt" | "openai";
export type GeminiImageMixAspectRatio =
  (typeof GEMINI_IMAGE_MIX_ASPECT_RATIOS)[number];
export type GeminiImageToImageAspectRatio =
  (typeof GEMINI_IMAGE_TO_IMAGE_ASPECT_RATIOS)[number];
export type GeminiImageToImageMode = "auto" | "edit" | "redesign";

export interface AiToolPayload {
  toolName: AiToolName;
  inputUrl: string | null;
  params: Record<string, unknown>;
}

export interface AiToolResponse<TData = unknown> {
  success: boolean;
  toolName?: string;
  message: string;
  outputUrl: string | null;
  outputData: TData | null;
  remainingCredits: number | null;
  jobId?: number | string | null;
  status?: string | null;
  workerType?: string | null;
  outputKey?: string | null;
  errorMessage?: string | null;
  queued?: boolean | null;
}

export interface GenerateResponse {
  status: string;
  remainingCredits?: number | null;
  provider?: string | null;
  requestedProvider?: string | null;
  providerFallbackUsed?: boolean;
  fallbackProvider?: string | null;
  images: {
    id: number;
    filename: string;
    url: string;
    input_image: string;
    style: string;
  }[];
}

export interface EnhanceResponse {
  enhanced_prompt: string;
  final_style?: string | null;
  remainingCredits?: number | null;
}

interface GeminiGenerateOptions {
  prompt: string;
  style?: string;
  numImages?: number;
  aspectRatio?: GeminiGenerationAspectRatio;
  enhancePrompt?: boolean;
  provider?: TextToImageProvider;
}

interface GeminiImageToImageOptions extends Omit<GeminiGenerateOptions, "prompt" | "aspectRatio"> {
  file: File;
  prompt?: string;
  aspectRatio?: GeminiImageToImageAspectRatio;
  maskFile?: File | null;
  editMode?: string;
  editType?: string;
  sourceColor?: string;
  targetColor?: string;
  colorPreset?: string;
  colorPalette?: string;
  targetElement?: string;
  replacement?: string;
  preserve?: string;
  changeStrength?: number;  
  referenceStrength?: number;
  promptStrength?: number;
  motifScale?: number | string;
  repeatType?: string;
  detailLevel?: string;
  colorLock?: string;
  motifLock?: string | string[];
  outputIntent?: string;
  qualityPreset?: string;
  variationType?: string;
}

interface GeminiImageMixOptions {
  files: File[];
  prompt: string;
  numImages?: number;
  aspectRatio?: GeminiImageMixAspectRatio;
}

export type UpscaleMode = "smart" | "double" | "textile";

const mapUpscaleModeToModel = (mode: UpscaleMode) => {
  switch (mode) {
    case "smart":
      return "smart";
    case "textile":
      return "textile";
    case "double":
      return "double";
    default:
      return "smart";
  }
};

const getImageExtensionFromMime = (mimeType?: string) => {
  switch ((mimeType || "").toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/png":
    default:
      return "png";
  }
};

const createSafeImageUploadFile = (file: File) => {
  const fallbackType = file.type || "image/png";
  const extension = getImageExtensionFromMime(fallbackType);
  const baseName = (file.name || "pattern-reference")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "pattern-reference";

  return new File([file], `${baseName}.${extension}`, { type: fallbackType });
};

export interface UpscaleResponse {
  status: string;
  image: string;
  generation_id: number;
  remainingCredits?: number | null;
  outputData?: {
    status?: string;
    message?: string;
    generation_id?: number;
    mode?: string;
    scale?: number;
    scale_label?: string;
    size_mode?: string;
    input?: {
      path?: string;
      url?: string;
      width?: number;
      height?: number;
    };
    output?: {
      filename?: string;
      path?: string;
      url?: string;
      media_type?: string;
      width?: number;
      height?: number;
    };
    artifacts?: {
      enhanced?: {
        path?: string;
        url?: string;
      };
      final?: {
        path?: string;
        url?: string;
      };
    };
  } | null;
}

export interface GenerateSeamlessResponse {
  success: boolean;
  message: string;
  output_image: string;
  tile_url?: string;
  preview_url?: string;
  validation?: unknown;
  remainingCredits?: number | null;
}

type SeamlessOutputData = {
  output_image?: string;
  image?: string;
  image_url?: string;
  tile_url?: string;
  preview_url?: string;
  validation?: unknown;
};

export const normalizeAiOutputUrl = (url?: string | null) => {
  return normalizeAiOutputUrlFromBase(ADMIN_SERVICE_URL, url);
};

const isGpuUpscaleOutputPath = (url: string) =>
  /^(?:files\/upscale|input)(?:\/|$)/i.test(getUrlPath(url).replace(/^\/+/, ""));

export const normalizeGpuOutputUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^(data:|blob:)/i.test(url)) return url;

  try {
    const parsedUrl = new URL(url, "http://placeholder.local");
    const pathWithQuery = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

    if (/^https?:\/\//i.test(url)) {
      if (isLocalOrPrivateHost(parsedUrl.hostname) || isGpuUpscaleOutputPath(url)) {
        return joinUrl(GPU_SERVICE_URL, pathWithQuery);
      }
      return url;
    }

    return joinUrl(GPU_SERVICE_URL, pathWithQuery);
  } catch {
    return joinUrl(GPU_SERVICE_URL, url);
  }
};

export const normalizeGeminiImageOutputUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^(data:|blob:)/i.test(url)) return url;

  try {
    const parsedUrl = new URL(url, "http://placeholder.local");

    if (isLocalOrPrivateHost(parsedUrl.hostname)) {
      return joinUrl(
        GEMINI_IMAGE_OUTPUT_BASE_URL,
        `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
      );
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }
  } catch {
    // Fall back to the base URL join below.
  }

  return joinUrl(GEMINI_IMAGE_OUTPUT_BASE_URL, url);
};

export const getAIImageUrl = (url: string) =>
  isGpuUpscaleOutputPath(url) ? normalizeGpuOutputUrl(url) : normalizeAiOutputUrl(url);

const assertAllowedAspectRatio = <TAspectRatio extends string>(
  aspectRatio: string,
  allowedAspectRatios: readonly TAspectRatio[],
  errorMessage: string
): TAspectRatio => {
  if (allowedAspectRatios.includes(aspectRatio as TAspectRatio)) {
    return aspectRatio as TAspectRatio;
  }

  throw new Error(errorMessage);
};

const mapAiResponseToGenerateResponse = (
  response: AiToolResponse,
  inputUrl: string | null,
  styleValue: string
): GenerateResponse => {
  const images = extractGeneratedImages(response);

  if (IS_DEV) {
    console.debug("[aiApi] Extracted generated images", {
      extractedCount: images.length,
      extractedImages: images,
      outputUrl: response.outputUrl,
      outputData: response.outputData,
    });
  }

  return {
    status: response.success ? "success" : "error",
    remainingCredits: response.remainingCredits,
    images: images.map((image, index) => ({
      id: index + 1,
      filename: image.filename,
      url: image.url,
      input_image: inputUrl || "",
      style: styleValue,
    })),
  };
};

const shouldFallbackToLegacySeamlessPattern = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status || 0;
  return status === 400 || status === 404 || status === 422 || status === 501;
};

const generateLegacySeamlessPattern = async (
  file: File,
  options: {
    mode?: "auto" | "manual";
    horizontalBand?: number;
    verticalBand?: number;
    provider?: string;
    generationMode?: "repair" | "reference";
    prompt?: string;
  } = {}
): Promise<GenerateSeamlessResponse> => {
  if (!AI_SERVICE_URL) {
    throw new Error(
      "Seamless pattern fallback is unavailable because VITE_AI_SERVICE_URL is not configured."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  if (options.provider) {
    formData.append("provider", options.provider);
  }
  if (options.generationMode === "reference") {
    formData.append("generation_mode", "reference_seamless");
  }
  if (options.prompt?.trim()) {
    formData.append("prompt", options.prompt.trim());
  }
  if (options.mode === "manual") {
    formData.append("horizontal_band", String(options.horizontalBand || 48));
    formData.append("vertical_band", String(options.verticalBand || 48));
  }

  const legacyAiApi = axios.create({
    baseURL: AI_SERVICE_URL,
  });

  applyIndustrialInterceptors(legacyAiApi);

  const response = await legacyAiApi.post<
    GenerateSeamlessResponse & { image?: string; image_url?: string },
    GenerateSeamlessResponse & { image?: string; image_url?: string }
  >(LEGACY_SEAMLESS_PATTERN_ENDPOINT, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const outputImage = normalizeAiOutputUrlFromBase(
    AI_SERVICE_URL,
    response.output_image || response.image || response.image_url || ""
  );

  return {
    success: Boolean(response.success && outputImage),
    message: response.message,
    output_image: outputImage,
  };
};

export const uploadAiInputAsset = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", file.name);
  let primaryError: unknown = null;

  for (const endpoint of AI_INPUT_UPLOAD_ENDPOINTS) {
    try {
      const uploadApi = createAiAssetUploadApi(endpoint);
      const response = await uploadApi.post<unknown, unknown>("", formData);
      return extractUploadedAssetUrl(response);
    } catch (error) {
      const { shouldTryNext, shouldPreserveAsPrimary } = getUploadFallbackEligibility(error);

      if (!primaryError || shouldPreserveAsPrimary) {
        primaryError = error;
      }

      if (!shouldTryNext) {
        break;
      }
    }
  }

  throw new Error(getUploadErrorMessage(primaryError));
};

export const invokeAiTool = async <TData = unknown>(
  payload: AiToolPayload
): Promise<AiToolResponse<TData>> => {
  const normalizedPayload = normalizeAiToolPayloadAssetUrls(payload);
  const response = await aiStudioApi.post<AiToolResponse<TData>, AiToolResponse<TData>>(
    "/use",
    normalizedPayload
  );

  dispatchCreditsUpdated(response.remainingCredits);

  if (IS_DEV) {
    console.debug("[aiApi] Raw /ai/use response", {
      toolName: normalizedPayload.toolName,
      requestedParams: normalizedPayload.params,
      inputUrl: normalizedPayload.inputUrl,
      response,
    });
  }

  return {
    ...response,
    outputUrl: normalizeAiOutputUrl(response.outputUrl),
  };
};

const AI_JOB_TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "FAILED_RETRY_LIMIT"]);

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const getAiJobStatus = async <TData = unknown>(
  jobId: number | string
): Promise<AiToolResponse<TData>> => {
  const response = await aiStudioApi.get<AiToolResponse<TData>, AiToolResponse<TData>>(
    `/jobs/${encodeURIComponent(String(jobId))}`
  );
  dispatchCreditsUpdated(response.remainingCredits);

  return {
    ...response,
    outputUrl: normalizeAiOutputUrl(response.outputUrl || response.outputKey),
  };
};

export const waitForAiJobCompletion = async <TData = unknown>(
  jobId: number | string,
  {
    intervalMs = 2500,
    timeoutMs = 600000,
  }: {
    intervalMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<AiToolResponse<TData>> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await getAiJobStatus<TData>(jobId);
    const status = String(response.status || "").toUpperCase();

    if (AI_JOB_TERMINAL_STATUSES.has(status)) {
      if (status !== "COMPLETED") {
        throw new Error(response.errorMessage || response.message || "AI job failed.");
      }
      return response;
    }

    await sleep(intervalMs);
  }

  throw new Error("AI job is still processing. Please check again shortly.");
};

export const enhancePrompt = async (
  prompt: string,
  file?: File,
  style = "floral"
): Promise<EnhanceResponse> => {
  const inputUrl = file ? await uploadAiInputAsset(file) : null;
  const response = await invokeAiTool<{
    enhanced_prompt?: string;
    final_style?: string;
  }>({
    toolName: "PROMPT_ENHANCER",
    inputUrl,
    params: {
      user_prompt: prompt,
      style,
    },
  });

  return {
    enhanced_prompt:
      response.outputData?.enhanced_prompt ||
      (typeof response.outputData === "string" ? response.outputData : prompt),
    final_style: response.outputData?.final_style || style,
    remainingCredits: response.remainingCredits,
  };
};

export const generateDesign = async (formData: FormData): Promise<GenerateResponse> => {
  const referenceFile = formData.get("file");
  const inputUrl =
    referenceFile instanceof File ? await uploadAiInputAsset(referenceFile) : null;
  const styleValue = String(formData.get("style") || "floral");
  const prompt = String(formData.get("user_prompt") || formData.get("manual_prompt") || "");
  const toolName: AiToolName = inputUrl ? "IMAGE_TO_IMAGE" : "TEXTILE_GENERATOR";

  const response = await invokeAiTool({
    toolName,
    inputUrl,
    params: {
      user_prompt: prompt,
      strength: toNumber(formData.get("strength"), 0.75),
      guidance_scale: toNumber(formData.get("guidance_scale"), 8),
      num_images: toNumber(formData.get("num_images"), 1),
      style: styleValue,
    },
  });

  return mapAiResponseToGenerateResponse(response, inputUrl, styleValue);
};

export const generateGeminiTextToImage = async ({
  prompt,
  style = "",
  numImages = 1,
  aspectRatio = "1:1",
  enhancePrompt = true,
  provider = "gemini",
}: GeminiGenerateOptions): Promise<GenerateResponse> => {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new Error("user_prompt is required for Gemini text to image.");
  }

  const response = await invokeAiTool({
    toolName: "GEMINI_TEXT_TO_IMAGE",
    inputUrl: null,
    params: {
      user_prompt: trimmedPrompt,
      style,
      aspect_ratio: assertAllowedAspectRatio(
        aspectRatio,
        GEMINI_GENERATION_ASPECT_RATIOS,
        "Invalid aspect_ratio for Gemini text to image."
      ),
      enhance_prompt: enhancePrompt,
      provider,
      num_images: numImages,
    },
  });

  return mapAiResponseToGenerateResponse(response, null, style);
};

export const generateGeminiImageToImage = async ({
  file,
  prompt = "",
  style = "floral",
  numImages = 1,
  aspectRatio = "1:1",
  enhancePrompt = true,
  maskFile = null,
  editMode,
  editType,
  sourceColor,
  targetColor,
  colorPreset,
  colorPalette,
  targetElement,
  replacement,
  preserve,
  changeStrength,
  referenceStrength,
  promptStrength,
  motifScale,
  repeatType,
  detailLevel,
  colorLock,
  motifLock,
  outputIntent,
  qualityPreset,
  variationType,
}: GeminiImageToImageOptions): Promise<GenerateResponse> => {
  const inputUrl = await uploadAiInputAsset(file);
  const maskUrl = maskFile ? await uploadAiInputAsset(maskFile) : null;
  const trimmedPrompt = prompt.trim();
  const params: Record<string, unknown> = {
    ...(trimmedPrompt ? { prompt: trimmedPrompt, user_prompt: trimmedPrompt } : {}),
    style,
    enhance_prompt: enhancePrompt,
    num_images: numImages,
  };

  if (aspectRatio === "auto") {
    params.aspect_ratio = "auto";
  } else {
    params.aspect_ratio = assertAllowedAspectRatio(
      aspectRatio,
      GEMINI_GENERATION_ASPECT_RATIOS,
      "Invalid aspect_ratio for Gemini image to image."
    );
  }

  const setParam = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    params[key] = Array.isArray(value) ? value.join(", ") : value;
  };

  setParam("edit_mode", editMode);
  setParam("edit_type", editType);
  setParam("source_color", sourceColor);
  setParam("target_color", targetColor);
  setParam("color_preset", colorPreset);
  setParam("color_palette", colorPalette);
  setParam("mask_file", maskUrl);
  setParam("target_element", targetElement);
  setParam("replacement", replacement);
  setParam("preserve", preserve);
  setParam("change_strength", changeStrength);
  setParam("reference_strength", referenceStrength);
  setParam("prompt_strength", promptStrength);
  setParam("motif_scale", motifScale);
  setParam("repeat_type", repeatType);
  setParam("detail_level", detailLevel);
  setParam("color_lock", colorLock);
  setParam("motif_lock", motifLock);
  setParam("output_intent", outputIntent);
  setParam("quality_preset", qualityPreset);
  setParam("variation_type", variationType);

  const response = await invokeAiTool({
    toolName: "GEMINI_IMAGE_TO_IMAGE",
    inputUrl,
    params,
  });

  return mapAiResponseToGenerateResponse(response, inputUrl, style);
};

export const generateGeminiImgToImg = async ({
  file,
  prompt,
  mode = "auto",
  aspectRatio = "auto",
  numImages = 1,
  editType,
  changeStrength,
  referenceStrength,
  promptStrength,
  preserve,
  motifLock,
  outputIntent,
  qualityPreset,
  variationType,
  provider = "gemini",
}: {
  file: File;
  prompt: string;
  mode?: GeminiImageToImageMode;
  aspectRatio?: GeminiImageToImageAspectRatio;
  numImages?: number;
  provider?: TextToImageProvider;
  editType?: string;
  changeStrength?: number;
  referenceStrength?: number;
  promptStrength?: number;
  preserve?: string;
  motifLock?: string | string[];
  outputIntent?: string;
  qualityPreset?: string;
  variationType?: string;
}): Promise<GenerateResponse> => {
  const trimmedPrompt = prompt.trim();

  if (!file) {
    throw new Error("image is required for Gemini image to image.");
  }

  if (!trimmedPrompt) {
    throw new Error("prompt is required for Gemini image to image.");
  }

  const safeUploadFile = createSafeImageUploadFile(file);
  const formData = new FormData();
  formData.append("file", safeUploadFile, safeUploadFile.name);
  formData.append("prompt", trimmedPrompt);
  formData.append("provider", provider);
  formData.append("mode", mode);
  formData.append("edit_mode", mode);

  if (editType) {
    formData.append("edit_type", editType);
  }

  if (aspectRatio && aspectRatio !== "auto") {
    formData.append("aspect_ratio", aspectRatio);
  }

  if (typeof changeStrength === "number") {
    formData.append("change_strength", String(changeStrength));
  }

  if (typeof referenceStrength === "number") {
    formData.append("reference_strength", String(referenceStrength));
  }

  if (typeof promptStrength === "number") {
    formData.append("prompt_strength", String(promptStrength));
  }

  if (preserve) {
    formData.append("preserve", preserve);
  }

  if (motifLock) {
    formData.append("motif_lock", Array.isArray(motifLock) ? motifLock.join(", ") : motifLock);
  }

  if (outputIntent) {
    formData.append("output_intent", outputIntent);
  }

  if (qualityPreset) {
    formData.append("quality_preset", qualityPreset);
  }

  if (variationType) {
    formData.append("variation_type", variationType);
  }

  formData.append("num_images", String(numImages));

  const data = await generateGeminiImageToImageRequest(formData);
  if (typeof data.remaining_credits === "number") {
    dispatchCreditsUpdated(data.remaining_credits);
  } else {
    try {
      const credits = await getMyCredits();
      dispatchCreditsUpdated(credits);
    } catch {
      // Ignore refresh failures; the generation already succeeded.
    }
  }
  const urls = [...(data.image_urls ?? []), ...(data.output_url ? [data.output_url] : [])]
    .map((url) => normalizeGeminiImageOutputUrl(url))
    .filter(Boolean);
  const images = [...new Set(urls)].map((url, index) => ({
    id: index + 1,
    filename: `rdc-pattern-maker-${index + 1}.png`,
    url,
    input_image: "",
    style: mode,
  }));

  return {
    status: data.success === false ? "error" : "success",
    remainingCredits: data.remaining_credits ?? null,
    provider: data.provider ?? null,
    requestedProvider: data.requested_provider ?? null,
    providerFallbackUsed: Boolean(data.provider_fallback_used),
    fallbackProvider: data.fallback_provider ?? null,
    images,
  };
};

export const generateGeminiImageMix = async ({
  files,
  prompt,
  numImages = 1,
  aspectRatio = "1:1",
}: GeminiImageMixOptions): Promise<GenerateResponse> => {
  if (files.length < 2 || files.length > 3) {
    throw new Error("Gemini image mix requires 2 or 3 input images.");
  }

  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new Error("prompt is required for Gemini image mix.");
  }

  const inputUrls = await Promise.all(files.map((file) => uploadAiInputAsset(file)));

  const response = await invokeAiTool({
    toolName: "GEMINI_IMAGE_MIX",
    inputUrl: null,
    params: {
      inputUrls,
      prompt: trimmedPrompt,
      num_images: numImages,
      aspect_ratio: assertAllowedAspectRatio(
        aspectRatio,
        GEMINI_IMAGE_MIX_ASPECT_RATIOS,
        "Invalid aspect_ratio for Gemini image mix."
      ),
    },
  });

  return mapAiResponseToGenerateResponse(response, null, "mix");
};

const upscaleImageViaProxy = async (
  file: File,
  mode: UpscaleMode,
  options?: {
    scale?: number;
    sizeMode?: "increase_pixels" | "same_dimensions";
    prompt?: string;
    batch?: boolean;
  }
): Promise<UpscaleResponse> => {
  const inputUrl = await uploadAiInputAsset(file);
  const response = await invokeAiTool<UpscaleResponse["outputData"]>({
    toolName: "UPSCALE",
    inputUrl,
    params: {
      mode: mapUpscaleModeToModel(mode),
      scale: options?.scale || (mode === "double" ? 8 : 4),
      size_mode: options?.sizeMode || "increase_pixels",
      prompt: options?.prompt || "",
      ...(options?.batch ? { batch: true } : {}),
    },
  });

  const finalImageUrl =
    normalizeAiOutputUrl(response.outputUrl) ||
    normalizeAiOutputUrl(response.outputData?.output?.url) ||
    normalizeAiOutputUrl(response.outputData?.artifacts?.final?.url);

  return {
    status: response.success ? "success" : "error",
    image: finalImageUrl,
    generation_id: Date.now(),
    remainingCredits: response.remainingCredits,
    outputData: response.outputData,
  };
};

const upscaleImageViaGpu = async (
  file: File,
  mode: UpscaleMode,
  options?: {
    scale?: number;
    sizeMode?: "increase_pixels" | "same_dimensions";
    prompt?: string;
    batch?: boolean;
  }
): Promise<UpscaleResponse> => {
  const token = getToken();

  if (!token) {
    throw new Error("Please sign in again before using GPU upscale.");
  }

  const safeUploadFile = createSafeImageUploadFile(file);
  const formData = new FormData();
  formData.append("file", safeUploadFile, safeUploadFile.name);
  formData.append("mode", mapUpscaleModeToModel(mode));
  formData.append("scale", String(options?.scale || (mode === "double" ? 8 : 4)));
  formData.append("size_mode", options?.sizeMode || "increase_pixels");
  formData.append("prompt", options?.prompt || "");

  const response = await axios.post<UpscaleResponse["outputData"]>(
    `${GPU_SERVICE_URL}/ai/upscale`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      transformRequest: [
        (data, headers) => {
          if (headers) {
            delete (headers as Record<string, unknown>)["Content-Type"];
            delete (headers as Record<string, unknown>)["content-type"];
          }
          return data;
        },
      ],
    }
  );

  const outputData = response.data;
  const finalImageUrl =
    normalizeGpuOutputUrl(outputData?.output?.url) ||
    normalizeGpuOutputUrl(outputData?.artifacts?.final?.url) ||
    normalizeGpuOutputUrl(outputData?.output?.path);

  if (!finalImageUrl) {
    throw new Error(outputData?.message || "GPU upscale completed without an output image URL.");
  }

  return {
    status: outputData?.status || "success",
    image: finalImageUrl,
    generation_id: outputData?.generation_id || Date.now(),
    remainingCredits: null,
    outputData,
  };
};

export const upscaleImage = async (
  file: File,
  mode: UpscaleMode,
  options?: {
    scale?: number;
    sizeMode?: "increase_pixels" | "same_dimensions";
    prompt?: string;
    batch?: boolean;
  }
): Promise<UpscaleResponse> => {
  if (!USE_DIRECT_GPU_UPSCALE) {
    return upscaleImageViaProxy(file, mode, options);
  }

  try {
    return await upscaleImageViaGpu(file, mode, options);
  } catch (error) {
    if (ENABLE_UPSCALE_PROXY_FALLBACK) {
      console.warn("[aiApi] GPU upscale failed, falling back to Java AI proxy", error);
      return upscaleImageViaProxy(file, mode, options);
    }
    throw error;
  }
};

export const useColorwayTool = async ({
  file,
  sourceColorHex,
  targetColorHex,
  strength,
}: {
  file: File;
  sourceColorHex: string;
  targetColorHex: string;
  strength: number;
}) => {
  const inputUrl = await uploadAiInputAsset(file);

  return invokeAiTool({
    toolName: "COLORWAY",
    inputUrl,
    params: {
      source_color_hex: sourceColorHex,
      target_color_hex: targetColorHex,
      strength,
    },
  });
};

export const useColorSeparationTool = async ({
  file,
  numColors,
  mergeSimilarColors,
}: {
  file: File;
  numColors: number;
  mergeSimilarColors: boolean;
}) => {
  const inputUrl = await uploadAiInputAsset(file);

  return invokeAiTool({
    toolName: "COLOR_SEPARATION",
    inputUrl,
    params: {
      num_colors: numColors,
      merge_similar_colors: mergeSimilarColors,
    },
  });
};

export const useImageMixTool = async ({
  files,
  prompt,
  numImages,
  aspectRatio = "1:1",
}: {
  files: File[];
  prompt: string;
  numImages: number;
  aspectRatio?: GeminiImageMixAspectRatio;
}) => {
  return generateGeminiImageMix({
    files,
    prompt,
    numImages,
    aspectRatio,
  });
};

export const upscaleBatch = async () => {
  throw new Error("Batch upscale should be executed client-side through repeated UPSCALE requests.");
};

const inferSeamlessPreviewUrl = (tileUrl: string) => {
  if (!tileUrl) return "";
  return tileUrl.replace(/_seamless(\.[a-z0-9]+)(\?.*)?$/i, "_preview$1$2");
};

export const generateSeamlessPattern = async (
  file: File,
  options: {
    mode?: "auto" | "manual";
    horizontalBand?: number;
    verticalBand?: number;
    provider?: string;
    generationMode?: "repair" | "reference";
    prompt?: string;
  } = {}
): Promise<GenerateSeamlessResponse> => {
  try {
    const inputUrl = await uploadAiInputAsset(file);
    const params: Record<string, unknown> = {};
    if (options.mode === "manual") {
      params.horizontal_band = options.horizontalBand;
      params.vertical_band = options.verticalBand;
    }
    if (options.provider) {
      params.provider = options.provider;
    }
    if (options.generationMode === "reference") {
      params.generation_mode = "reference_seamless";
    }
    if (options.prompt?.trim()) {
      params.prompt = options.prompt.trim();
    }

    let response = await invokeAiTool<SeamlessOutputData>({
      toolName: SEAMLESS_PATTERN_TOOL_NAME,
      inputUrl,
      params,
    });

    if (response.queued && response.jobId) {
      response = await waitForAiJobCompletion<SeamlessOutputData>(response.jobId);
    }

    const outputImage =
      response.outputUrl ||
      response.outputKey ||
      extractOutputUrls(response)[0] ||
      normalizeAiOutputUrl(
        response.outputData?.tile_url ||
          response.outputData?.output_image ||
          response.outputData?.image ||
          response.outputData?.image_url ||
          ""
      );
    const previewUrl = normalizeAiOutputUrl(response.outputData?.preview_url || "") || inferSeamlessPreviewUrl(outputImage);

    return {
      success: response.success && Boolean(outputImage),
      message: response.message,
      output_image: outputImage,
      tile_url: outputImage,
      preview_url: previewUrl,
      validation: response.outputData?.validation,
      remainingCredits: response.remainingCredits,
    };
  } catch (error) {
    if (!shouldFallbackToLegacySeamlessPattern(error)) {
      throw error;
    }

    return generateLegacySeamlessPattern(file, options);
  }
};

export const getHistory = async (style?: string): Promise<unknown[]> => {
  const response = await fetchHistory({
    source: "all",
    style: style?.trim() || undefined,
    limit: 20,
    offset: 0,
  });

  return response.data;
};

export const checkAIHealth = async () => ({
  status: "ok",
  adminServiceUrl: AI_USE_BASE_URL,
  assetUploadEndpoint: AI_INPUT_UPLOAD_ENDPOINT,
});

export default aiStudioApi;
