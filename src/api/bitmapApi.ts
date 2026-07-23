import axios from "axios";

import { getToken } from "@/api/apiClient";
import { AI_CREDITS_UPDATED_EVENT } from "@/api/aiApi";

type BitmapParamValue = string | number | boolean | null | undefined;
type BitmapParamMap = Record<string, BitmapParamValue>;

export type BitmapUploadResponse = {
  message: string;
  filename: string;
  path: string;
  sizeBytes: number;
  bitmapId: number | null;
  remainingCredits?: number | null;
  creditsRequired?: number | null;
};

export type BitmapAnalysisResponse = {
  status: string;
  filename: string;
  designType: string;
  confidence: number | null;
  suggestedStyles: string[];
  analysis: {
    edgeDensityScore: number | null;
    colorSaturationScore: number | null;
    [key: string]: unknown;
  };
  remainingCredits?: number | null;
  creditsRequired?: number | null;
};

export type BitmapBinaryResponse = {
  blob: Blob;
  remainingCredits: number | null;
  creditsRequired: number | null;
};

export type BitmapGeminiImageToImageResponse = {
  success: boolean;
  message?: string;
  output_url?: string;
  image_urls?: string[];
  remaining_credits?: number;
  credits_required?: number;
  final_prompt?: string;
  prompt_enhanced?: boolean;
  fallback_used?: boolean;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const stripBitmapProxySuffix = (value: string) => value.replace(/\/api\/bitmap$/i, "");

const SUBSCRIPTION_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL || "http://localhost:8094"
);

const BITMAP_API = trimTrailingSlash(
  import.meta.env.VITE_BITMAP_BACKEND_URL ||
    import.meta.env.VITE_BITMAP_SERVICE_PUBLIC_URL ||
    import.meta.env.VITE_BITMAP_SERVICE_URL ||
    `${SUBSCRIPTION_BASE_URL}/api/bitmap`
);

const BITMAP_PUBLIC_URL = stripBitmapProxySuffix(BITMAP_API);

const bitmapClient = axios.create({
  baseURL: BITMAP_API,
});

const getAccessToken = (token?: string) => token || getToken() || localStorage.getItem("token") || "";

const getAuthHeaders = (token?: string) => {
  const accessToken = getAccessToken(token);
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const toQueryParams = (params: BitmapParamMap) => {
  const queryParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    queryParams[key] = String(value);
  });

  return queryParams;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toNullableString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toBoolean = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1" || value === "yes";

const parseHeaderNumber = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const parsed = Number(raw.trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const parseResponseCredits = (headers: unknown) => {
  const record = isRecord(headers) ? headers : {};
  return {
    remainingCredits: parseHeaderNumber(record["x-remaining-credits"]),
    creditsRequired: parseHeaderNumber(record["x-credits-required"]),
  };
};

const dispatchCreditsUpdated = (remainingCredits?: number | null) => {
  if (typeof window === "undefined" || typeof remainingCredits !== "number") return;

  window.dispatchEvent(
    new CustomEvent<number>(AI_CREDITS_UPDATED_EVENT, {
      detail: remainingCredits,
    })
  );
};

const resolveServiceImageUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(url)) return url;
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${BITMAP_PUBLIC_URL}${normalized}`;
};

const createBitmapError = async (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return new Error(error instanceof Error ? error.message : "Something went wrong");
  }

  const rawBody = error.response?.data;
  let payload: unknown = rawBody;

  if (typeof rawBody === "string") {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = rawBody;
    }
  }

  const detail =
    (isRecord(payload) && typeof payload.detail === "string" && payload.detail) ||
    (isRecord(payload) && typeof payload.message === "string" && payload.message) ||
    (isRecord(payload) && typeof payload.error === "string" && payload.error) ||
    (typeof payload === "string" ? payload : "") ||
    `Bitmap request failed (${error.response?.status || error.message || "unknown"})`;

  return new Error(detail);
};

const normalizeUploadResponse = (payload: unknown): BitmapUploadResponse => {
  const record = isRecord(payload) ? payload : {};
  return {
    message: typeof record.message === "string" ? record.message : "Upload successful",
    filename: typeof record.filename === "string" ? record.filename : "",
    path: typeof record.path === "string" ? record.path : "",
    sizeBytes:
      typeof record.sizeBytes === "number"
        ? record.sizeBytes
        : typeof record.size_bytes === "number"
          ? record.size_bytes
          : 0,
    bitmapId:
      typeof record.bitmapId === "number"
        ? record.bitmapId
        : typeof record.bitmap_id === "number"
          ? record.bitmap_id
          : null,
    remainingCredits:
      typeof record.remainingCredits === "number"
        ? record.remainingCredits
        : typeof record.remaining_credits === "number"
          ? record.remaining_credits
          : null,
    creditsRequired:
      typeof record.creditsRequired === "number"
        ? record.creditsRequired
        : typeof record.credits_required === "number"
          ? record.credits_required
          : null,
  };
};

const normalizeAnalysisResponse = (payload: unknown): BitmapAnalysisResponse => {
  const record = isRecord(payload) ? payload : {};
  const analysisRecord = (isRecord(record.analysis) ? record.analysis : {}) as Record<string, unknown>;

  return {
    status: typeof record.status === "string" ? record.status : "success",
    filename: typeof record.filename === "string" ? record.filename : "",
    designType:
      typeof record.designType === "string"
        ? record.designType
        : typeof record.design_type === "string"
          ? record.design_type
          : "Unknown",
    confidence:
      typeof record.confidence === "number"
        ? record.confidence
        : typeof record.confidence === "string" && Number.isFinite(Number(record.confidence))
          ? Number(record.confidence)
          : null,
    suggestedStyles: Array.isArray(record.suggestedStyles)
      ? record.suggestedStyles.filter((item): item is string => typeof item === "string")
      : Array.isArray(record.suggested_styles)
        ? record.suggested_styles.filter((item): item is string => typeof item === "string")
        : [],
    analysis: {
      ...analysisRecord,
      edgeDensityScore:
        typeof analysisRecord.edgeDensityScore === "number"
          ? analysisRecord.edgeDensityScore
          : typeof analysisRecord.edge_density_score === "number"
            ? analysisRecord.edge_density_score
            : null,
      colorSaturationScore:
        typeof analysisRecord.colorSaturationScore === "number"
          ? analysisRecord.colorSaturationScore
          : typeof analysisRecord.color_saturation_score === "number"
            ? analysisRecord.color_saturation_score
            : null,
    },
    remainingCredits:
      typeof record.remainingCredits === "number"
        ? record.remainingCredits
        : typeof record.remaining_credits === "number"
          ? record.remaining_credits
          : null,
    creditsRequired:
      typeof record.creditsRequired === "number"
        ? record.creditsRequired
        : typeof record.credits_required === "number"
          ? record.credits_required
          : null,
  };
};

const normalizeGeminiResponse = (payload: unknown): BitmapGeminiImageToImageResponse => {
  const record = isRecord(payload) ? payload : {};
  const imageUrls = Array.isArray(record.image_urls)
    ? record.image_urls
        .map((item) => (typeof item === "string" ? resolveServiceImageUrl(item) : ""))
        .filter(Boolean)
    : [];

  const outputUrl = typeof record.output_url === "string" ? resolveServiceImageUrl(record.output_url) : "";

  return {
    success:
      typeof record.success === "boolean"
        ? record.success
        : toBoolean(record.success),
    message: typeof record.message === "string" ? record.message : undefined,
    output_url: outputUrl || undefined,
    image_urls: imageUrls.length > 0 ? imageUrls : undefined,
    remaining_credits:
      typeof record.remaining_credits === "number"
        ? record.remaining_credits
        : typeof record.remainingCredits === "number"
          ? record.remainingCredits
          : undefined,
    credits_required:
      typeof record.credits_required === "number"
        ? record.credits_required
        : typeof record.creditsRequired === "number"
          ? record.creditsRequired
          : undefined,
    final_prompt: toNullableString(record.final_prompt) || undefined,
    prompt_enhanced: typeof record.prompt_enhanced === "boolean" ? record.prompt_enhanced : toBoolean(record.prompt_enhanced),
    fallback_used: typeof record.fallback_used === "boolean" ? record.fallback_used : toBoolean(record.fallback_used),
  };
};

const postForm = async (path: string, params: BitmapParamMap, token?: string) => {
  return bitmapClient.post(path, null, {
    headers: {
      ...getAuthHeaders(token),
    },
    params: toQueryParams(params),
  });
};

const postBinary = async (path: string, params: BitmapParamMap, token?: string): Promise<BitmapBinaryResponse> => {
  const response = await bitmapClient.post(path, null, {
    headers: {
      ...getAuthHeaders(token),
    },
    params: toQueryParams(params),
    responseType: "blob",
  });

  const credits = parseResponseCredits(response.headers);
  dispatchCreditsUpdated(credits.remainingCredits);

  return {
    blob: response.data,
    remainingCredits: credits.remainingCredits,
    creditsRequired: credits.creditsRequired,
  };
};

const postMultipart = async (path: string, formData: FormData, token?: string) => {
  return bitmapClient.post(path, formData, {
    headers: {
      ...getAuthHeaders(token),
    },
  });
};

export const getBitmapErrorMessage = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (isRecord(data)) {
      return (
        (typeof data.message === "string" && data.message) ||
        (typeof data.detail === "string" && data.detail) ||
        "Something went wrong"
      );
    }
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }

  return "Something went wrong";
};

export const bitmapApi = {
  async health(token?: string) {
    const response = await bitmapClient.get("/health", {
      headers: getAuthHeaders(token),
    });

    return response.status >= 200 && response.status < 300;
  },

  async upload(file: File, token?: string) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await postMultipart("/upload/", formData, token);
    return normalizeUploadResponse(response.data);
  },

  async analyze(filename: string, token?: string) {
    const response = await postForm("/analyze/", { filename }, token);
    return normalizeAnalysisResponse(response.data);
  },

  async previewHalftone(params: BitmapParamMap, token?: string) {
    return postBinary("/halftone/monochrome", params, token);
  },

  async previewDither(params: BitmapParamMap, token?: string) {
    return postBinary("/dither/", params, token);
  },

  async previewSeparationProof(params: BitmapParamMap, token?: string) {
    return postBinary("/halftone/separation/proof", params, token);
  },

  async exportSeparationZip(params: BitmapParamMap, token?: string) {
    return postBinary("/halftone/separation", params, token);
  },

  async exportPsd(params: BitmapParamMap, token?: string) {
    return postBinary("/halftone/separation/psd", params, token);
  },

  async exportCmyk(params: BitmapParamMap, token?: string) {
    return postBinary("/halftone/cmyk/", params, token);
  },

  async geminiImageToImage(formData: FormData, token?: string) {
    const response = await postMultipart("/gemini-image/image-to-image", formData, token);
    return normalizeGeminiResponse(response.data);
  },
};
