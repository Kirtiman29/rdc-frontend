import axios, { AxiosProgressEvent } from "axios";
import { getToken } from "./apiClient";
import {
  aiStudioApi,
  invokeAiTool,
  normalizeAiOutputUrl,
  uploadAiInputAsset,
} from "./aiApi";
import type { AiToolResponse } from "./aiApi";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeBaseUrl = (value?: string) => value?.replace(/\/+$/, "") || "";

const parsePositiveInteger = (value: unknown) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const getDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return normalizeBaseUrl(import.meta.env.VITE_AI_SERVICE_URL);
  }

  const { protocol, hostname } = window.location;

  if (!hostname || hostname === "localhost" || hostname === "192.168.0.154") {
    return normalizeBaseUrl(import.meta.env.VITE_AI_SERVICE_URL);
  }

  return `${protocol}//${hostname}:8000`;
};

const getDefaultBitmapBaseUrl = () => {
  if (typeof window === "undefined") {
    return "http://localhost:8002";
  }

  const { protocol, hostname } = window.location;

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8002";
  }

  return `${protocol}//${hostname}:8002`;
};
export const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_COLOR_SEPARATION_API_BASE_URL) ||
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
  normalizeBaseUrl(import.meta.env.VITE_AI_SERVICE_URL) ||
  getDefaultApiBaseUrl();

const FASTAPI_PUBLIC_URL =
  normalizeBaseUrl(import.meta.env.VITE_AI_SERVICE_URL) ||
  "http://192.168.0.154:8000";

const BITMAP_PUBLIC_URL =
  normalizeBaseUrl(import.meta.env.VITE_COLOR_SEPARATION_OUTPUT_BASE_URL) ||
  normalizeBaseUrl(import.meta.env.VITE_BITMAP_OUTPUT_BASE_URL) ||
  getDefaultBitmapBaseUrl();

const COLOR_SEPARATION_DETAIL_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_COLOR_SEPARATION_DETAIL_BASE_URL) ||
  BITMAP_PUBLIC_URL;
export const COLOR_SEPARATION_ENDPOINT =
  import.meta.env.VITE_COLOR_SEPARATION_ENDPOINT || "/color-separation/";

export const COLOR_SEPARATION_JOBS_ENDPOINT =
  import.meta.env.VITE_COLOR_SEPARATION_JOBS_ENDPOINT || "/color-separation/jobs";

export const COLOR_SEPARATION_TIMEOUT_MS =
  parsePositiveInteger(import.meta.env.VITE_COLOR_SEPARATION_TIMEOUT_MS) || 300000;

export const COLOR_SEPARATION_TIMEOUT_SECONDS = Math.max(
  1,
  Math.round(COLOR_SEPARATION_TIMEOUT_MS / 1000)
);

const COLOR_SEPARATION_POLL_INTERVAL_MS =
  parsePositiveInteger(import.meta.env.VITE_COLOR_SEPARATION_POLL_INTERVAL_MS) || 2000;

const COLOR_SEPARATION_COMPLETED_STATUSES = new Set(["COMPLETED", "SUCCESS"]);
const COLOR_SEPARATION_ACTIVE_STATUSES = new Set([
  "CREATED",
  "QUEUED",
  "GPU_STARTING",
  "PROCESSING",
]);
const COLOR_SEPARATION_FAILED_STATUSES = new Set([
  "FAILED",
  "FAILED_RETRY_LIMIT",
  "ERROR",
]);

export type ColorSeparationLayer = {
  layer_index: number;
  layer_name: string;
  layer_path: string;
  flat_layer_path?: string | null;
  photoshop_layer_path?: string | null;
  detected_color?: string | null;
};

export type ColorSeparationResult = {
  job_id?: string | null;
  created_at?: string | null;
  original_filename?: string | null;
  requested_num_colors?: number | null;
  status?: string;
  reconstructable: boolean;
  original_image: string | null;
  reconstructed_preview?: string | null;
  reconstruction_exact?: boolean | null;
  photoshop_ready?: boolean | null;
  photoshop_base_layer?: string | null;
  photoshop_merged_preview?: string | null;
  photoshop_manifest?: string | null;
  photoshop_script?: string | null;
  photoshop_psd?: string | null;
  photoshop_psd_ready?: boolean | null;
  photoshop_package?: string | null;
  num_colors: number;
  detected_colors: string[];
  layers: ColorSeparationLayer[];
};

export type ColorSeparationResponse = ColorSeparationResult;

export type ColorSeparationJobSummary = {
  job_id: string;
  status: string;
  original_filename: string | null;
  num_colors: number | null;
  created_at: string | null;
};

export type SeparateColorsOptions = {
  signal?: AbortSignal;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  colorCountField?: string;
};

const toArray = (value: unknown) => (Array.isArray(value) ? value : []);

const toNumber = (value: unknown, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const toNullableString = (value: unknown) =>
  typeof value === "string" && value ? value : null;

const toNullableNumber = (value: unknown) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const fixFastApiOutputPath = (path?: string | null) => {
  if (!path) return "";

  return path.replace("/storage/outputs/", "/static/outputs/");
};

export const normalizeColorSeparationResponse = (
  payload: unknown
): ColorSeparationResult => {
  const data = isRecord(payload) ? payload : {};
  const rawLayers = toArray(data.layers);
  const detectedColors = toArray(data.detected_colors).filter(
    (color): color is string => typeof color === "string" && Boolean(color)
  );

  const layers = rawLayers
    .filter(isRecord)
    .map((layer, index) => {
      const layerIndex = toNumber(layer.layer_index, index + 1);

      return {
        layer_index: layerIndex,
        layer_name:
          typeof layer.layer_name === "string" && layer.layer_name
            ? layer.layer_name
            : `Layer ${layerIndex}`,
        layer_path: typeof layer.layer_path === "string" ? layer.layer_path : "",
        flat_layer_path: toNullableString(layer.flat_layer_path),
        photoshop_layer_path: toNullableString(layer.photoshop_layer_path),
        detected_color: toNullableString(layer.detected_color),
      };
    })
    .filter((layer) => layer.layer_path);

  const numColors = toNumber(
    data.num_colors,
    layers.length || detectedColors.length || 0
  );

  return {
    job_id: toNullableString(data.job_id),
    created_at: toNullableString(data.created_at),
    original_filename: toNullableString(data.original_filename),
    requested_num_colors: toNullableNumber(data.requested_num_colors),
    status: typeof data.status === "string" ? data.status : undefined,
    reconstructable: Boolean(data.reconstructable),
    original_image: toNullableString(data.original_image),
    reconstructed_preview: toNullableString(data.reconstructed_preview),
    reconstruction_exact:
      typeof data.reconstruction_exact === "boolean"
        ? data.reconstruction_exact
        : null,
    photoshop_ready:
      typeof data.photoshop_ready === "boolean"
        ? data.photoshop_ready
        : null,
    photoshop_base_layer: toNullableString(data.photoshop_base_layer),
    photoshop_merged_preview: toNullableString(data.photoshop_merged_preview),
    photoshop_manifest: toNullableString(data.photoshop_manifest),
    photoshop_script: toNullableString(data.photoshop_script),
    photoshop_psd: toNullableString(data.photoshop_psd),
    photoshop_psd_ready:
      typeof data.photoshop_psd_ready === "boolean"
        ? data.photoshop_psd_ready
        : false,
    photoshop_package: toNullableString(data.photoshop_package),
    num_colors: numColors,
    detected_colors: detectedColors,
    layers,
  };
};

export const normalizeColorSeparationJobSummary = (
  payload: unknown
): ColorSeparationJobSummary => {
  const data = isRecord(payload) ? payload : {};

  return {
    job_id: toNullableString(data.job_id) || "",
    status: toNullableString(data.status) || "unknown",
    original_filename: toNullableString(data.original_filename),
    num_colors: toNullableNumber(data.num_colors),
    created_at: toNullableString(data.created_at),
  };
};

export function getColorSeparationErrorMessage(error: unknown) {
  if (axios.isCancel(error)) {
    return "Color separation was cancelled before the backend finished.";
  }

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return `The AI gateway did not respond within ${COLOR_SEPARATION_TIMEOUT_SECONDS}s. Large artworks can take longer, so try Manual mode or a smaller image, and make sure the service is responding.`;
    }

    if (error.message === "Network Error") {
      return "Could not reach the AI gateway for color separation. Make sure the backend services are running and reachable.";
    }

    const responseData = error.response?.data;

    if (isRecord(responseData)) {
      if (typeof responseData.detail === "string" && responseData.detail) {
        return responseData.detail;
      }

      if (Array.isArray(responseData.detail)) {
        return responseData.detail
          .map((item) => {
            if (isRecord(item) && typeof item.msg === "string") {
              return item.msg;
            }

            return String(item);
          })
          .join(", ");
      }

      if (typeof responseData.message === "string" && responseData.message) {
        return responseData.message;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong while processing this artwork.";
}

type ColorSeparationAiResponse = AiToolResponse<
  ColorSeparationResponse | UnknownRecord
>;

const abortColorSeparationError = () =>
  new DOMException("Color separation was cancelled.", "AbortError");

const waitForColorSeparationPoll = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortColorSeparationError());
      return;
    }

    const timeout = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(abortColorSeparationError());
      },
      { once: true }
    );
  });

const normalizeJobStatus = (value: unknown) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const readNestedRecordValue = (source: unknown, key: string): unknown => {
  if (!isRecord(source)) return undefined;

  const directValue = source[key];
  if (directValue !== undefined && directValue !== null) return directValue;

  for (const nestedKey of ["outputData", "data", "job", "result"]) {
    const nestedValue = source[nestedKey];
    if (isRecord(nestedValue)) {
      const value = nestedValue[key];
      if (value !== undefined && value !== null) return value;
    }
  }

  return undefined;
};

const readColorSeparationJobId = (response: ColorSeparationAiResponse) => {
  const jobId =
    readNestedRecordValue(response, "jobId") ?? readNestedRecordValue(response, "id");
  if (typeof jobId === "number" && Number.isFinite(jobId)) return String(jobId);
  if (typeof jobId === "string" && jobId.trim()) return jobId.trim();
  return null;
};

const readColorSeparationStatus = (response: ColorSeparationAiResponse) =>
  normalizeJobStatus(readNestedRecordValue(response, "status"));

const readColorSeparationOutputPath = (response: ColorSeparationAiResponse) => {
  const outputPath =
    readNestedRecordValue(response, "outputKey") ??
    readNestedRecordValue(response, "outputUrl") ??
    readNestedRecordValue(response, "reconstructed_preview") ??
    readNestedRecordValue(response, "photoshop_package") ??
    readNestedRecordValue(response, "photoshop_psd");

  return typeof outputPath === "string" && outputPath ? outputPath : null;
};

const hasDetailedColorSeparationPayload = (value: unknown) =>
  isRecord(value) && Array.isArray(value.layers);

const isQueuedColorSeparationResponse = (response: ColorSeparationAiResponse) => {
  if (response.queued) return true;
  const status = readColorSeparationStatus(response);
  return COLOR_SEPARATION_ACTIVE_STATUSES.has(status);
};

const fetchColorSeparationJob = async (jobId: string) =>
  aiStudioApi.get<ColorSeparationAiResponse, ColorSeparationAiResponse>(
    `/jobs/${encodeURIComponent(jobId)}`
  );

const toBitmapColorSeparationJobId = (jobId: string) =>
  jobId.startsWith("job-") ? jobId : `job-${jobId}`;

const fetchDetailedColorSeparationJob = async (jobId: string) => {
  const bitmapJobId = toBitmapColorSeparationJobId(jobId);
  const url = `${COLOR_SEPARATION_DETAIL_BASE_URL}/color-separation/jobs/${encodeURIComponent(bitmapJobId)}`;
  const response = await axios.get<ColorSeparationResponse>(url);
  return response.data;
};
const waitForColorSeparationJob = async (
  jobId: string,
  signal?: AbortSignal
): Promise<ColorSeparationAiResponse> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < COLOR_SEPARATION_TIMEOUT_MS) {
    if (signal?.aborted) {
      throw abortColorSeparationError();
    }

    const response = await fetchColorSeparationJob(jobId);
    const status = readColorSeparationStatus(response);

    if (import.meta.env.DEV) {
      console.log("Color separation job status", { jobId, status, response });
    }

    if (COLOR_SEPARATION_COMPLETED_STATUSES.has(status)) {
      return response;
    }

    if (COLOR_SEPARATION_FAILED_STATUSES.has(status) || response.success === false) {
      throw new Error(
        response.errorMessage || response.message || "Color separation failed."
      );
    }

    await waitForColorSeparationPoll(COLOR_SEPARATION_POLL_INTERVAL_MS, signal);
  }

  throw new Error(
    `Color separation did not finish within ${COLOR_SEPARATION_TIMEOUT_SECONDS}s.`
  );
};

const buildColorSeparationFallbackPayload = (
  response: ColorSeparationAiResponse,
  inputUrl: string,
  numColors?: number | "" | null
) => {
  const outputPath = fixFastApiOutputPath(readColorSeparationOutputPath(response));
  const requestedColors =
    numColors !== "" && numColors !== null && numColors !== undefined
      ? Number(numColors)
      : 0;

  return {
    job_id: readColorSeparationJobId(response),
    status: readColorSeparationStatus(response) || (response.success ? "success" : "error"),
    reconstructable: Boolean(outputPath),
    original_image: inputUrl,
    reconstructed_preview: outputPath,
    photoshop_package: outputPath,
    photoshop_psd: outputPath,
    photoshop_psd_ready: Boolean(outputPath),
    num_colors: Number.isFinite(requestedColors) ? requestedColors : 0,
    detected_colors: [],
    layers: outputPath
      ? [
          {
            layer_index: 1,
            layer_name: "Color Separation Result",
            layer_path: outputPath,
          },
        ]
      : [],
  };
};

export async function separateColors(
  file: File,
  numColors?: number | "" | null,
  options: SeparateColorsOptions = {}
) {
  const { signal, onUploadProgress } = options;
  void onUploadProgress;
  void options.colorCountField;

  if (signal?.aborted) {
    throw abortColorSeparationError();
  }

  if (import.meta.env.DEV) {
    console.log("Color separation request payload", {
      fileName: file?.name,
      num_colors: numColors,
    });
  }

  const inputUrl = await uploadAiInputAsset(file);

  if (signal?.aborted) {
    throw abortColorSeparationError();
  }

  let response = await invokeAiTool<ColorSeparationResponse | UnknownRecord>({
    toolName: "COLOR_SEPARATION",
    inputUrl,
    params: {
      ...(numColors !== "" && numColors !== null && numColors !== undefined
        ? { num_colors: Number(numColors) }
        : {}),
      merge_similar_colors: false,
    },
  });

  if (import.meta.env.DEV) {
    console.log("Color separation response", response);
  }

  const initialStatus = readColorSeparationStatus(response);
  if (!response.success && !COLOR_SEPARATION_ACTIVE_STATUSES.has(initialStatus)) {
    throw new Error(
      response.errorMessage || response.message || "Color separation failed."
    );
  }

  let queuedJobId: string | null = null;

  if (isQueuedColorSeparationResponse(response)) {
    const jobId = readColorSeparationJobId(response);
    if (!jobId) {
      throw new Error("Color separation job was queued but no job id was returned.");
    }

    queuedJobId = jobId;
    response = await waitForColorSeparationJob(jobId, signal);
  }

  const finalStatus = readColorSeparationStatus(response);
  if (COLOR_SEPARATION_FAILED_STATUSES.has(finalStatus) || response.success === false) {
    throw new Error(
      response.errorMessage || response.message || "Color separation failed."
    );
  }

  let normalizedPayload: unknown = hasDetailedColorSeparationPayload(response.outputData)
    ? response.outputData
    : null;

  const completedJobId = queuedJobId || readColorSeparationJobId(response);
  if (!normalizedPayload && completedJobId) {
    try {
      normalizedPayload = await fetchDetailedColorSeparationJob(completedJobId);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Unable to fetch detailed color separation result", error);
      }
    }
  }

  if (!normalizedPayload) {
    normalizedPayload = buildColorSeparationFallbackPayload(response, inputUrl, numColors);
  }

  return normalizeColorSeparationResponse(normalizedPayload);
}

export async function getColorSeparationJobs(_limit?: number) {
  return [];
}

export async function getColorSeparationJob(_jobId: string) {
  throw new Error(
    "Color separation job history is not available through the AI gateway yet."
  );
}

export const getFullImageUrl = (path?: string | null) => {
  if (!path || typeof path !== "string" || path === "null") return "";

  const fixedPath = fixFastApiOutputPath(path);

  if (/^https?:\/\//i.test(fixedPath)) {
    try {
      const url = new URL(fixedPath);

      if (url.pathname.startsWith("/storage/")) {
        return `${BITMAP_PUBLIC_URL}${url.pathname}${url.search}${url.hash}`;
      }

      if (url.pathname.startsWith("/static/")) {
        return `${FASTAPI_PUBLIC_URL}${url.pathname}${url.search}${url.hash}`;
      }

      return fixedPath;
    } catch {
      return fixedPath;
    }
  }

  if (fixedPath.startsWith("/storage/")) {
    return `${BITMAP_PUBLIC_URL}${fixedPath}`;
  }

  if (fixedPath.startsWith("storage/")) {
    return `${BITMAP_PUBLIC_URL}/${fixedPath}`;
  }

  if (fixedPath.startsWith("/static/")) {
    return `${FASTAPI_PUBLIC_URL}${fixedPath}`;
  }

  return normalizeAiOutputUrl(fixedPath);
};

export async function downloadAsset(path: string, filename: string) {
  const url = getFullImageUrl(path);
  if (!url) throw new Error("Download asset path is unavailable.");

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Unable to download ${filename}.`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export const downloadImage = downloadAsset;
