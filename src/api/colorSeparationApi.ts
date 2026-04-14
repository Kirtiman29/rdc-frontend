import { getToken } from "./apiClient";

export const COLOR_SEPARATION_TIMEOUT_SECONDS = 120;

const AI_BASE_URL = `${import.meta.env.VITE_AI_SERVICE_URL || ""}`.replace(/\/$/, "");
const COLOR_SEPARATION_ENDPOINT =
  import.meta.env.VITE_COLOR_SEPARATION_ENDPOINT || "/color-separation/separate";

export type ColorSeparationLayer = {
  layer_index: number;
  layer_name: string;
  layer_path: string;
  flat_layer_path?: string | null;
  detected_color?: string | null;
};

export type ColorSeparationResult = {
  original_image?: string;
  reconstructed_preview?: string;
  detected_colors?: string[];
  num_colors?: number;
  reconstructable?: boolean;
  reconstruction_exact?: boolean;
  photoshop_package?: string;
  photoshop_script?: string;
  photoshop_psd?: string;
  photoshop_psd_ready?: boolean;
  layers?: ColorSeparationLayer[];
};

const normalizePath = (path?: string | null) => {
  if (!path || path === "null") return "";
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/\\/g, "/");
  return `${AI_BASE_URL}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
};

export const getFullImageUrl = (path?: string | null) => normalizePath(path);

export async function separateColors(file: File, numColors?: number | "") {
  const formData = new FormData();
  formData.append("file", file);

  if (typeof numColors === "number" && Number.isFinite(numColors)) {
    formData.append("num_colors", String(numColors));
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    COLOR_SEPARATION_TIMEOUT_SECONDS * 1000
  );

  try {
    const token = getToken();
    const response = await fetch(`${AI_BASE_URL}${COLOR_SEPARATION_ENDPOINT}`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.detail || data?.message || "Color separation failed.");
    }

    return data as ColorSeparationResult;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getColorSeparationErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return `Color separation timed out after ${COLOR_SEPARATION_TIMEOUT_SECONDS}s. Backend may be busy.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Color separation failed. Please try again.";
}

export async function downloadAsset(path: string, filename: string) {
  const url = getFullImageUrl(path);
  if (!url) throw new Error("Download asset path is unavailable.");

  const token = getToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("Download failed.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

export async function downloadImage(path: string, filename: string) {
  await downloadAsset(path, filename);
}
