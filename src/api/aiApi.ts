import axios from "axios";
import { applyIndustrialInterceptors, getAssetUrl } from "./apiClient";

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

const DEFAULT_AI_INPUT_UPLOAD_ENDPOINT = `${ASSET_SERVICE_URL}/api/assets/ai-upload`;
const AI_INPUT_UPLOAD_ENDPOINT = normalizeEndpoint(
  import.meta.env.VITE_AI_INPUT_UPLOAD_ENDPOINT || DEFAULT_AI_INPUT_UPLOAD_ENDPOINT
);
const AI_INPUT_UPLOAD_ENDPOINTS = [AI_INPUT_UPLOAD_ENDPOINT, DEFAULT_AI_INPUT_UPLOAD_ENDPOINT]
  .filter(Boolean)
  .map(normalizeEndpoint)
  .filter((value, index, items) => items.indexOf(value) === index);

const AI_USE_BASE_URL = `${ADMIN_SERVICE_URL}/api/ai`;
const SEAMLESS_PATTERN_TOOL_NAME = (import.meta.env.VITE_SEAMLESS_PATTERN_TOOL_NAME || "PATTERN_GENERATOR").trim();
const LEGACY_SEAMLESS_PATTERN_ENDPOINT = (
  import.meta.env.VITE_SEAMLESS_PATTERN_ENDPOINT || "/pattern/generate-seamless"
).trim();

export const AI_CREDITS_UPDATED_EVENT = "ai-credits-updated";

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

const shouldUseAiServiceForOutput = (url: string) =>
  Boolean(AI_SERVICE_URL) && /^\/?patterns(?:\/|$)/i.test(getUrlPath(url).replace(/^\/+/, ""));

const normalizeAiPatternOutputUrl = (url: string) => {
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
  if (shouldUseAiServiceForOutput(url)) return normalizeAiPatternOutputUrl(url);
  if (/^https?:\/\//i.test(url)) return url;
  return joinUrl(baseUrl, url);
};

const toNumber = (value: FormDataEntryValue | null, fallback: number) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const readUrlsFromValue = (value: unknown, urls: string[]) => {
  if (!value) return;

  if (typeof value === "string") {
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

const extractOutputUrls = (response: AiToolResponse) => {
  const urls: string[] = [];

  if (response.outputUrl) {
    urls.push(response.outputUrl);
  }

  readUrlsFromValue(response.outputData, urls);

  return [...new Set(urls.map((url) => normalizeAiOutputUrl(url)).filter(Boolean))];
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
  | "IMAGE_MIX"
  | "COLORWAY"
  | "COLOR_SEPARATION"
  | "SEAMLESS_PATTERN";

export type AiToolName = BuiltInAiToolName | (string & {});

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

export type UpscaleMode = "normal" | "double" | "textile";

export interface UpscaleResponse {
  status: string;
  image: string;
  generation_id: number;
  remainingCredits?: number | null;
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

  const response = await invokeAiTool({
    toolName: "TEXTILE_GENERATOR",
    inputUrl,
    params: {
      user_prompt: String(formData.get("user_prompt") || formData.get("manual_prompt") || ""),
      strength: toNumber(formData.get("strength"), 0.75),
      guidance_scale: toNumber(formData.get("guidance_scale"), 8),
      num_images: toNumber(formData.get("num_images"), 1),
      style: styleValue,
    },
  });

  const urls = extractOutputUrls(response);

  return {
    status: response.success ? "success" : "error",
    remainingCredits: response.remainingCredits,
    images: urls.map((url, index) => ({
      id: index + 1,
      filename: `generated-${index + 1}.png`,
      url,
      input_image: inputUrl || "",
      style: styleValue,
    })),
  };
};

export const upscaleImage = async (
  file: File,
  mode: UpscaleMode,
  _userId?: number
): Promise<UpscaleResponse> => {
  const inputUrl = await uploadAiInputAsset(file);
  const response = await invokeAiTool({
    toolName: "UPSCALE",
    inputUrl,
    params: {
      mode,
    },
  });

  return {
    status: response.success ? "success" : "error",
    image: normalizeAiOutputUrl(response.outputUrl),
    generation_id: Date.now(),
    remainingCredits: response.remainingCredits,
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
}: {
  files: File[];
  prompt: string;
  numImages: number;
}) => {
  const inputUrls = await Promise.all(files.map((file) => uploadAiInputAsset(file)));

  return invokeAiTool({
    toolName: "IMAGE_MIX",
    inputUrl: null,
    params: {
      inputUrls,
      prompt,
      num_images: numImages,
    },
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

export const getHistory = async (_style?: string): Promise<any> => [];

export const checkAIHealth = async () => ({
  status: "ok",
  adminServiceUrl: AI_USE_BASE_URL,
  assetUploadEndpoint: AI_INPUT_UPLOAD_ENDPOINT,
});

export default aiStudioApi;
