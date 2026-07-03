import axios, { AxiosProgressEvent } from "axios";
import { getToken } from "./apiClient";
import {
  invokeAiTool,
  normalizeAiOutputUrl,
  uploadAiInputAsset,
} from "./aiApi";

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

export const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_COLOR_SEPARATION_API_BASE_URL) ||
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
  normalizeBaseUrl(import.meta.env.VITE_AI_SERVICE_URL) ||
  getDefaultApiBaseUrl();

const FASTAPI_PUBLIC_URL =
  normalizeBaseUrl(import.meta.env.VITE_AI_SERVICE_URL) ||
  "http://192.168.0.154:8000";

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

export async function separateColors(
  file: File,
  numColors?: number | "" | null,
  options: SeparateColorsOptions = {}
) {
  const { signal, onUploadProgress } = options;
  void onUploadProgress;
  void options.colorCountField;

  if (signal?.aborted) {
    throw new DOMException("Color separation was cancelled.", "AbortError");
  }

  if (import.meta.env.DEV) {
    console.log("Color separation request payload", {
      fileName: file?.name,
      num_colors: numColors,
    });
  }

  const inputUrl = await uploadAiInputAsset(file);

  if (signal?.aborted) {
    throw new DOMException("Color separation was cancelled.", "AbortError");
  }

  const response = await invokeAiTool<ColorSeparationResponse>({
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

  if (!response.success) {
    throw new Error(response.message || "Color separation failed.");
  }

  const previewUrl = fixFastApiOutputPath(response.outputUrl);

  const normalizedPayload =
    response.outputData || {
      status: response.success ? "success" : "error",
      reconstructable: false,
      original_image: inputUrl,
      reconstructed_preview: previewUrl,
      num_colors: 0,
      detected_colors: [],
      layers: previewUrl
        ? [
            {
              layer_index: 1,
              layer_name: "Reconstructed Preview",
              layer_path: previewUrl,
            },
          ]
        : [],
    };

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

      if (url.pathname.startsWith("/static/")) {
        return `${FASTAPI_PUBLIC_URL}${url.pathname}${url.search}${url.hash}`;
      }

      return fixedPath;
    } catch {
      return fixedPath;
    }
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
