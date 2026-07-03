import type { GenerateResponse, PresetId } from "@/types/textile";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://192.168.0.154:8000").replace(/\/+$/, "");

export function resolveImageUrl(url?: string) {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export function normalizeBackendImageUrl(url?: string) {
  if (!url) return "";
  if (/^(data:|blob:)/i.test(url)) return url;

  try {
    const parsed = new URL(url);

    if (parsed.hostname === "192.168.0.155" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return `${API_BASE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // Fall back to the generic resolver below.
  }

  return resolveImageUrl(url);
}

export async function generateImage(form: FormData): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/gemini-image/image-to-image`, {
    method: "POST",
    body: form,
  });

  const raw = await response.text();
  const data = parseJson(raw);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }

  return (typeof data === "object" && data ? data : {}) as GenerateResponse;
}

export function buildPresetForm(params: {
  file: File;
  preset: PresetId;
  targetColor?: string;
  prompt?: string;
  numImages?: number;
}) {
  const form = new FormData();
  form.append("file", params.file);
  form.append("color_preset", getBackendPreset(params.preset));
  form.append("target_color", params.targetColor ?? "#264F7A");
  form.append("num_images", String(params.numImages ?? 1));
  form.append("enhance_prompt", "false");

  if (params.prompt?.trim()) {
    form.append("prompt", params.prompt.trim());
  }

  return form;
}

export function buildBackgroundForm(params: {
  file: File;
  backgroundColor: string;
  prompt?: string;
  numImages?: number;
}) {
  const instruction =
    `Change only the textile background color to ${params.backgroundColor}. ` +
    "Keep all motifs, flowers, leaves, linework, print details, texture, and foreground colors unchanged. " +
    "Do not recolor motifs or pattern elements.";

  const finalPrompt = params.prompt?.trim() ? `${params.prompt.trim()}. ${instruction}` : instruction;

  const form = new FormData();
  form.append("file", params.file);
  form.append("prompt", finalPrompt);
  form.append("edit_mode", "precise_edit");
  form.append("edit_type", "change color");
  form.append("target_element", "background");
  form.append("target_color", params.backgroundColor);
  form.append("replacement", `background color ${params.backgroundColor}`);
  form.append("preserve", "motifs, foreground colors, linework, print details, texture, pattern layout");
  form.append("change_strength", "medium");
  form.append("reference_strength", "medium");
  form.append("prompt_strength", "medium");
  form.append("num_images", String(params.numImages ?? 1));
  form.append("enhance_prompt", "false");

  return form;
}

function getBackendPreset(preset: PresetId) {
  if (preset === "dusty" || preset === "dark_dusty") return "dark_dusty";
  if (["fresh", "candy", "ice_cream", "kids"].includes(preset)) return "pastel";
  if (["home_decor", "home_furnishing", "wallpaper", "earthy"].includes(preset)) return "natural";
  if (preset.startsWith("dark_") || preset === "dark") return "dark";
  return preset;
}

function parseJson(value: string) {
  if (!value.trim()) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function extractErrorMessage(data: unknown, status: number) {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;
    const detail = payload.detail ?? payload.message ?? payload.error;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }

  return `Request failed with status ${status}`;
}
