import axios from "axios";

import { clearTokens, getRefreshToken, getToken, saveTokens } from "@/api/apiClient";
import { AI_CREDITS_UPDATED_EVENT } from "@/api/aiApi";
import { serviceApiUrls } from "@/api/serviceConfig";

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

type BitmapJobResponse = {
  success: boolean;
  jobId: number | null;
  status: string;
  outputKey: string | null;
  errorMessage: string | null;
  message: string | null;
  queued: boolean;
  creditsConsumed: boolean;
  remainingCredits: number | null;
  creditsRequired: number | null;
};

export type BitmapGeminiImageToImageResponse = {
  success: boolean;
  message?: string;
  provider?: string;
  requested_provider?: string;
  provider_fallback_used?: boolean;
  fallback_provider?: string;
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
const BITMAP_OUTPUT_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_BITMAP_OUTPUT_BASE_URL ||
    import.meta.env.VITE_COLOR_SEPARATION_OUTPUT_BASE_URL ||
    BITMAP_PUBLIC_URL
);
const BITMAP_JOB_POLL_INTERVAL_MS = Number(import.meta.env.VITE_BITMAP_JOB_POLL_INTERVAL_MS || 2500);
const BITMAP_JOB_TIMEOUT_MS = Number(import.meta.env.VITE_BITMAP_JOB_TIMEOUT_MS || 1800000);

const bitmapClient = axios.create({
  baseURL: BITMAP_API,
});

type BitmapRequestConfig = Parameters<typeof bitmapClient.request>[0] & {
  _bitmapAuthRetry?: boolean;
};

let bitmapRefreshPromise: Promise<string> | null = null;

const getAccessToken = (token?: string) => getToken() || localStorage.getItem("token") || token || "";

const getAuthHeaders = (token?: string) => {
  const accessToken = getAccessToken(token);
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const refreshBitmapAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const refreshResponse = await axios.post(serviceApiUrls.authRefresh, { refreshToken });
  const data = refreshResponse.data?.data || refreshResponse.data;
  const accessToken = typeof data?.accessToken === "string" ? data.accessToken : "";
  const newRefreshToken = typeof data?.refreshToken === "string" ? data.refreshToken : "";

  if (!accessToken || !newRefreshToken) {
    throw new Error("Invalid refresh response");
  }

  saveTokens(accessToken, newRefreshToken);
  return accessToken;
};

bitmapClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

bitmapClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as BitmapRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._bitmapAuthRetry) {
      return Promise.reject(error);
    }

    originalRequest._bitmapAuthRetry = true;

    try {
      bitmapRefreshPromise = bitmapRefreshPromise || refreshBitmapAccessToken();
      const accessToken = await bitmapRefreshPromise;

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return bitmapClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      bitmapRefreshPromise = null;
    }
  }
);

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

const dispatchCreditsUpdated = (remainingCredits?: number | null) => {
  if (typeof window === "undefined" || typeof remainingCredits !== "number") return;

  window.dispatchEvent(
    new CustomEvent<number>(AI_CREDITS_UPDATED_EVENT, {
      detail: remainingCredits,
    })
  );
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const resolveServiceImageUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(url)) return url;
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${BITMAP_OUTPUT_BASE_URL}${normalized}`;
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
    provider: toNullableString(record.provider) || undefined,
    requested_provider: toNullableString(record.requested_provider) || undefined,
    provider_fallback_used:
      typeof record.provider_fallback_used === "boolean"
        ? record.provider_fallback_used
        : toBoolean(record.provider_fallback_used),
    fallback_provider: toNullableString(record.fallback_provider) || undefined,
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

const toNullableNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeJobResponse = (payload: unknown): BitmapJobResponse => {
  const record = isRecord(payload) ? payload : {};
  const status = typeof record.status === "string" ? record.status : "";
  const normalizedStatus = status.toUpperCase();

  return {
    success: typeof record.success === "boolean" ? record.success : normalizedStatus !== "FAILED",
    jobId:
      toNullableNumber(record.jobId) ??
      toNullableNumber(record.job_id) ??
      toNullableNumber(record.id),
    status,
    outputKey:
      toNullableString(record.outputKey) ||
      toNullableString(record.output_key) ||
      toNullableString(record.outputUrl) ||
      toNullableString(record.output_url),
    errorMessage:
      toNullableString(record.errorMessage) ||
      toNullableString(record.error_message) ||
      toNullableString(record.error),
    message: toNullableString(record.message),
    queued:
      typeof record.queued === "boolean"
        ? record.queued
        : ["CREATED", "QUEUED", "PROCESSING"].includes(normalizedStatus),
    creditsConsumed:
      typeof record.creditsConsumed === "boolean"
        ? record.creditsConsumed
        : toBoolean(record.credits_consumed),
    remainingCredits:
      toNullableNumber(record.remainingCredits) ??
      toNullableNumber(record.remaining_credits),
    creditsRequired:
      toNullableNumber(record.creditsRequired) ??
      toNullableNumber(record.credits_required),
  };
};

const assertCompletedJob = (job: BitmapJobResponse) => {
  const status = job.status.toUpperCase();
  if (status === "FAILED") {
    throw new Error(job.errorMessage || job.message || "Bitmap job failed");
  }
  if (status !== "COMPLETED") {
    throw new Error(job.message || `Bitmap job ended with status ${job.status || "unknown"}`);
  }
  if (!job.outputKey) {
    throw new Error("Bitmap job completed without an output file");
  }
};

const getBitmapJobStatus = async (jobId: number, token?: string) => {
  const response = await bitmapClient.get(`/jobs/${jobId}`, {
    headers: {
      ...getAuthHeaders(token),
    },
  });
  return normalizeJobResponse(response.data);
};

const pollBitmapJob = async (jobId: number, token?: string) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < BITMAP_JOB_TIMEOUT_MS) {
    const job = await getBitmapJobStatus(jobId, token);
    const status = job.status.toUpperCase();

    if (typeof job.remainingCredits === "number") {
      dispatchCreditsUpdated(job.remainingCredits);
    }

    if (status === "COMPLETED" || status === "FAILED") {
      return job;
    }

    await sleep(BITMAP_JOB_POLL_INTERVAL_MS);
  }

  throw new Error("Bitmap job timed out. Please check the job again after some time.");
};

const postForm = async (path: string, params: BitmapParamMap, token?: string) => {
  return bitmapClient.post(path, null, {
    headers: {
      ...getAuthHeaders(token),
    },
    params: toQueryParams(params),
  });
};

const postQueuedBinary = async (path: string, params: BitmapParamMap, token?: string): Promise<BitmapBinaryResponse> => {
  const response = await bitmapClient.post(path, null, {
    headers: {
      ...getAuthHeaders(token),
    },
    params: toQueryParams(params),
  });

  const queuedJob = normalizeJobResponse(response.data);
  if (!queuedJob.jobId) {
    throw new Error(queuedJob.message || "Bitmap job was not queued");
  }

  const completedJob = await pollBitmapJob(queuedJob.jobId, token);
  assertCompletedJob(completedJob);

  const fileResponse = await axios.get(resolveServiceImageUrl(completedJob.outputKey), {
    responseType: "blob",
  });

  return {
    blob: fileResponse.data,
    remainingCredits: completedJob.remainingCredits,
    creditsRequired: completedJob.creditsRequired,
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

    const response = await postMultipart("/upload", formData, token);
    return normalizeUploadResponse(response.data);
  },

  async analyze(filename: string, token?: string) {
    const response = await postForm("/analyze", { filename }, token);
    return normalizeAnalysisResponse(response.data);
  },

  async previewHalftone(params: BitmapParamMap, token?: string) {
    return postQueuedBinary("/preview/halftone", params, token);
  },

  async previewDither(params: BitmapParamMap, token?: string) {
    return postQueuedBinary("/preview/dither", params, token);
  },

  async previewSeparationProof(params: BitmapParamMap, token?: string) {
    return postQueuedBinary("/preview/separation-proof", params, token);
  },

  async exportSeparationZip(params: BitmapParamMap, token?: string) {
    return postQueuedBinary("/export/separation-zip", params, token);
  },

  async exportPsd(params: BitmapParamMap, token?: string) {
    return postQueuedBinary("/export/psd", params, token);
  },

  async exportCmyk(params: BitmapParamMap, token?: string) {
    return postQueuedBinary("/export/cmyk", params, token);
  },

  async geminiImageToImage(formData: FormData, token?: string) {
    const response = await postMultipart("/gemini-image/image-to-image", formData, token);
    return normalizeGeminiResponse(response.data);
  },
};
