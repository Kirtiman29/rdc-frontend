import axios from "axios";
import { applyIndustrialInterceptors, getAssetUrl } from "./apiClient";
import { createApiUrl, serviceOrigins } from "./serviceConfig";

const ADMIN_SERVICE_URL = (
  import.meta.env.VITE_ADMIN_SERVICE_URL ||
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:8080"
).replace(/\/+$/, "");

const AI_SERVICE_URL = (import.meta.env.VITE_AI_SERVICE_URL || "").replace(/\/+$/, "");

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
const SEAMLESS_PATTERN_TOOL_NAME = (import.meta.env.VITE_SEAMLESS_PATTERN_TOOL_NAME || "PATTERN_GENERATOR").trim();
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

const rewriteLegacyAiHost = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    if (
      parsedUrl.hostname === "192.168.0.155" ||
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1"
    ) {
      return joinUrl(AI_SERVICE_URL || parsedUrl.origin, `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`);
    }
  } catch {
    // Ignore malformed URLs and fall back to the default logic below.
  }

  return url;
};

const shouldUseAiServiceForOutput = (url: string) =>
  Boolean(AI_SERVICE_URL) &&
  /^(?:patterns|output|files(?:\/|$)|static(?:\/|$)|storage(?:\/|$)|mixed-images(?:\/|$))/i.test(
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
export type GeminiImageMixAspectRatio =
  (typeof GEMINI_IMAGE_MIX_ASPECT_RATIOS)[number];
export type GeminiImageToImageAspectRatio =
  (typeof GEMINI_IMAGE_TO_IMAGE_ASPECT_RATIOS)[number];
export type GeminiImageToImageMode = "auto" | "edit" | "redesign";

const normalizeGeminiImageToImageEndpoint = (value: string) => {
  const trimmed = value.replace(/\/+$/, "");

  if (/\/gemini-image\/image-to-image$/i.test(trimmed)) {
    return trimmed;
  }

  if (/\/api\/gemini\/img-to-img$/i.test(trimmed)) {
    return trimmed.replace(/\/api\/gemini\/img-to-img$/i, "/gemini-image/image-to-image");
  }

  if (/\/img-to-img$/i.test(trimmed)) {
    return trimmed.replace(/\/img-to-img$/i, "/gemini-image/image-to-image");
  }

  return `${trimmed}/gemini-image/image-to-image`;
};

const GEMINI_IMAGE_TO_IMAGE_ENDPOINT = normalizeGeminiImageToImageEndpoint(
  import.meta.env.VITE_GEMINI_IMAGE_TO_IMAGE_ENDPOINT ||
    "http://192.168.0.154:8000"
);
const GEMINI_IMAGE_TO_IMAGE_INTERNAL_KEY = (
  import.meta.env.VITE_GEMINI_IMAGE_TO_IMAGE_INTERNAL_KEY ||
  import.meta.env.VITE_INTERNAL_KEY ||
  ""
).trim();

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
}

export interface GenerateResponse {
  status: string;
  remainingCredits?: number | null;
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

export interface UpscaleResponse {
  status: string;
  image: string;
  generation_id: number;
  remainingCredits?: number | null;
  outputData?: {
    status?: string;
    message?: string;
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
}

export const normalizeAiOutputUrl = (url?: string | null) => {
  return normalizeAiOutputUrlFromBase(ADMIN_SERVICE_URL, url);
};

export const getAIImageUrl = (url: string) => normalizeAiOutputUrl(url);

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
  file: File
): Promise<GenerateSeamlessResponse> => {
  if (!AI_SERVICE_URL) {
    throw new Error(
      "Seamless pattern fallback is unavailable because VITE_AI_SERVICE_URL is not configured."
    );
  }

  const formData = new FormData();
  formData.append("file", file);

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
  const response = await aiStudioApi.post<AiToolResponse<TData>, AiToolResponse<TData>>(
    "/use",
    payload
  );

  dispatchCreditsUpdated(response.remainingCredits);

  if (IS_DEV) {
    console.debug("[aiApi] Raw /ai/use response", {
      toolName: payload.toolName,
      requestedParams: payload.params,
      response,
    });
  }

  return {
    ...response,
    outputUrl: normalizeAiOutputUrl(response.outputUrl),
  };
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
  style = "floral",
  numImages = 1,
  aspectRatio = "1:1",
  enhancePrompt = true,
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

type GeminiImageToImageApiResponse = {
  success?: boolean;
  message?: string;
  outputUrl?: string;
  output_url?: string;
  output_image?: string;
  outputImage?: string;
  image?: string;
  imageUrl?: string;
  image_url?: string;
  imageBase64?: string;
  image_base64?: string;
  mimeType?: string;
  mime_type?: string;
  filename?: string;
  images?: Array<{
    outputUrl?: string;
    output_url?: string;
    output_image?: string;
    outputImage?: string;
    image?: string;
    imageUrl?: string;
    image_url?: string;
    url?: string;
    imageBase64?: string;
    image_base64?: string;
    mimeType?: string;
    mime_type?: string;
    filename?: string;
  }>;
  data?: unknown;
  result?: unknown;
  remainingCredits?: number | null;
};

const toDataUrl = (base64: string, mimeType: string) => {
  if (/^data:/i.test(base64)) {
    return base64;
  }

  return `data:${mimeType};base64,${base64}`;
};

const mimeTypeToExtension = (mimeType: string) => {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "png";
};

const normalizeGeminiImgToImgOutputUrl = (url: string) => {
  if (!url) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(url)) return url;

  try {
    return new URL(url, GEMINI_IMAGE_TO_IMAGE_ENDPOINT).toString();
  } catch {
    return url;
  }
};

const resolveGeminiImgToImgImageUrl = (item: GeminiImageToImageApiResponse, fallbackMimeType = "image/png") => {
  const candidate =
    item.outputUrl ||
    item.output_url ||
    item.output_image ||
    item.outputImage ||
    item.imageUrl ||
    item.image_url ||
    item.image;

  if (candidate && /^(\s*data:|\s*blob:|\s*https?:\/\/)/i.test(candidate)) {
    return candidate.trim();
  }

  if (candidate && !/^[A-Za-z0-9+/=]+$/.test(candidate.trim())) {
    return normalizeGeminiImgToImgOutputUrl(candidate.trim());
  }

  const mimeType = item.mimeType || item.mime_type || fallbackMimeType;
  const base64 = item.imageBase64 || item.image_base64 || candidate || "";

  if (!base64) return "";

  return toDataUrl(base64, mimeType);
};

export const generateGeminiImgToImg = async ({
  file,
  prompt,
  mode = "auto",
  aspectRatio = "auto",
  numImages = 1,
}: {
  file: File;
  prompt: string;
  mode?: GeminiImageToImageMode;
  aspectRatio?: GeminiImageToImageAspectRatio;
  numImages?: number;
}): Promise<GenerateResponse> => {
  const trimmedPrompt = prompt.trim();

  if (!file) {
    throw new Error("image is required for Gemini image to image.");
  }

  if (!trimmedPrompt) {
    throw new Error("prompt is required for Gemini image to image.");
  }

  if (!GEMINI_IMAGE_TO_IMAGE_INTERNAL_KEY) {
    throw new Error(
      "VITE_GEMINI_IMAGE_TO_IMAGE_INTERNAL_KEY is required to call the Gemini image-to-image backend."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("prompt", trimmedPrompt);
  formData.append("mode", mode);
  formData.append("aspect_ratio", aspectRatio);
  formData.append("num_images", String(numImages));

  const response = await fetch(GEMINI_IMAGE_TO_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "X-INTERNAL-KEY": GEMINI_IMAGE_TO_IMAGE_INTERNAL_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Gemini image-to-image request failed (${response.status}).`);
  }

  const data = (await response.json()) as GeminiImageToImageApiResponse;
  const mimeType = data.mimeType || data.mime_type || "image/png";
  const directImage = resolveGeminiImgToImgImageUrl(data, mimeType);
  const nestedSources = [data.data, data.result].filter(Boolean);

  const payloads: Array<Record<string, unknown>> = [];

  for (const item of data.images || []) {
    if (typeof item === "string") {
      payloads.push({ image: item });
      continue;
    }

    if (isRecord(item)) {
      payloads.push(item);
    }
  }

  if (payloads.length === 0) {
    for (const source of nestedSources) {
      if (!isRecord(source)) continue;

      if (Array.isArray(source.images)) {
        for (const item of source.images) {
          if (typeof item === "string") {
            payloads.push({ image: item });
          } else if (isRecord(item)) {
            payloads.push(item);
          }
        }
      }

      const nestedImage =
        resolveGeminiImgToImgImageUrl(
          {
            outputUrl: source.outputUrl as string | undefined,
            output_url: source.output_url as string | undefined,
            output_image: source.output_image as string | undefined,
            outputImage: source.outputImage as string | undefined,
            image: source.image as string | undefined,
            imageUrl: source.imageUrl as string | undefined,
            image_url: source.image_url as string | undefined,
            imageBase64: source.imageBase64 as string | undefined,
            image_base64: source.image_base64 as string | undefined,
            mimeType: source.mimeType as string | undefined,
            mime_type: source.mime_type as string | undefined,
            filename: source.filename as string | undefined,
          },
          mimeType
        );

      if (nestedImage) {
        payloads.push({
          image: nestedImage,
          filename: source.filename,
          mimeType: source.mimeType,
        });
      }
    }
  }

  if (payloads.length === 0 && directImage) {
    payloads.push({
      image: directImage,
      filename: data.filename,
      mimeType,
    });
  }

  if (payloads.length === 0) {
    const fallbackUrls: string[] = [];
    readUrlsFromValue(data, fallbackUrls);

    for (const url of fallbackUrls) {
      payloads.push({ image: url, filename: data.filename, mimeType });
    }
  }

  const images = payloads
    .map((item, index) => {
      const itemMimeType = String(item.mimeType || item.mime_type || mimeType || "image/png");
      const rawUrl =
        String(item.image || item.imageUrl || item.image_url || item.outputUrl || item.output_url || item.output_image || "");
      const resolvedUrl = resolveGeminiImgToImgImageUrl(
        {
          outputUrl: rawUrl,
          mimeType: itemMimeType,
          filename: typeof item.filename === "string" ? item.filename : undefined,
        },
        itemMimeType
      );

      if (!resolvedUrl) return null;

      return {
        id: index + 1,
        filename:
          typeof item.filename === "string" && item.filename.trim()
            ? item.filename.trim()
            : `gemini-img-to-img-${index + 1}.${mimeTypeToExtension(itemMimeType)}`,
        url: resolvedUrl,
        input_image: "",
        style: String(mode),
      };
    })
    .filter(Boolean) as GenerateResponse["images"];

  return {
    status: data.success === false ? "error" : "success",
    remainingCredits: data.remainingCredits ?? null,
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

export const generateSeamlessPattern = async (
  file: File
): Promise<GenerateSeamlessResponse> => {
  try {
    const inputUrl = await uploadAiInputAsset(file);
    const response = await invokeAiTool<{
      output_image?: string;
      image?: string;
      image_url?: string;
    }>({
      toolName: SEAMLESS_PATTERN_TOOL_NAME,
      inputUrl,
      params: {},
    });

    const outputImage =
      response.outputUrl ||
      extractOutputUrls(response)[0] ||
      normalizeAiOutputUrl(
        response.outputData?.output_image ||
          response.outputData?.image ||
          response.outputData?.image_url ||
          ""
      );

    return {
      success: response.success && Boolean(outputImage),
      message: response.message,
      output_image: outputImage,
    };
  } catch (error) {
    if (!shouldFallbackToLegacySeamlessPattern(error)) {
      throw error;
    }

    return generateLegacySeamlessPattern(file);
  }
};

export const getHistory = async (_style?: string): Promise<unknown[]> => [];

export const checkAIHealth = async () => ({
  status: "ok",
  adminServiceUrl: AI_USE_BASE_URL,
  assetUploadEndpoint: AI_INPUT_UPLOAD_ENDPOINT,
});

export default aiStudioApi;
