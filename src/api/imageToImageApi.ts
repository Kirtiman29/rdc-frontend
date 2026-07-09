import axios from "axios";

import { getToken } from "@/api/apiClient";
import type { GenerateResponse, PresetId } from "@/types/textile";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://192.168.0.154:8000").replace(/\/+$/, "");
const SUBSCRIPTION_BASE_URL = (import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL || "http://localhost:8094").replace(
  /\/+$/,
  ""
);
const INTERNAL_KEY = (
  import.meta.env.VITE_GEMINI_IMAGE_TO_IMAGE_INTERNAL_KEY ||
  import.meta.env.VITE_INTERNAL_KEY ||
  ""
).trim();
const DEFAULT_EDIT_STRENGTH = 0.7;
const DEFAULT_REFERENCE_STRENGTH = 0.7;
const DEFAULT_PROMPT_STRENGTH = 0.7;
const PASTEL_COLOR_PALETTE = "#fff1f4, #f7c8d2, #d88fa3, #b96a7e";
const DARK_COLOR_PALETTE = "#111827, #374151, #7f1d1d, #d1d5db";
const GEMINI_IMAGE_TO_IMAGE_ALLOWED_KEYS = new Set([
  "file",
  "image",
  "input_image",
  "prompt",
  "mode",
  "aspect_ratio",
  "num_images",
]);

export function resolveImageUrl(url?: string) {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function resolveSubscriptionImageUrl(url?: string) {
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${SUBSCRIPTION_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export function normalizeBackendImageUrl(url?: string) {
  if (!url) return "";
  if (/^(data:|blob:)/i.test(url)) return url;

  try {
    const parsed = new URL(url);

    if (
      (parsed.hostname === "192.168.0.154" && parsed.port === "8002") ||
      parsed.hostname === "192.168.0.155" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1"
    ) {
      return `${API_BASE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // Fall back to the generic resolver below.
  }

  return resolveImageUrl(url);
}

export async function generateImage(form: FormData): Promise<GenerateResponse> {
  const data = await generateGeminiImageToImage(form);
  return data as unknown as GenerateResponse;
}

export type GeminiImageToImageServiceResponse = {
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

export async function generateGeminiImageToImage(
  form: FormData
): Promise<GeminiImageToImageServiceResponse> {
  const token = getToken() || localStorage.getItem("token") || "";

  if (!token) {
    throw new Error("Please sign in to generate Gemini image-to-image results.");
  }

  const postRequest = async (payload: FormData) => {
    const response = await axios.post<GeminiImageToImageServiceResponse>(
      `${SUBSCRIPTION_BASE_URL}/api/gemini-image/image-to-image`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = (response.data ?? { success: false }) as GeminiImageToImageServiceResponse;
    if (typeof data.remaining_credits === "number") {
      window.dispatchEvent(
        new CustomEvent("ai-credits-updated", {
          detail: data.remaining_credits,
        })
      );
    }
    return {
      ...data,
      output_url: resolveSubscriptionImageUrl(data.output_url),
      image_urls: Array.isArray(data.image_urls)
        ? data.image_urls
            .map((url) => resolveSubscriptionImageUrl(url))
            .filter((url): url is string => Boolean(url))
        : undefined,
    };
  };

  try {
    return await postRequest(form);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data;
      const message = extractErrorMessage(payload, error.response?.status ?? 500);
      throw new Error(message);
    }

    throw error;
  }
}

export function buildPresetForm(params: {
  file: File;
  preset: PresetId;
  targetColor?: string;
  prompt?: string;
  numImages?: number;
}) {
  const form = new FormData();
  const preset = getBackendPreset(params.preset);

  form.append("file", params.file);
  form.append("color_preset", preset);

  if (preset === "pastel") {
    form.append("color_palette", PASTEL_COLOR_PALETTE);
  }

  if (preset === "dark") {
    form.append("color_palette", DARK_COLOR_PALETTE);
  }

  form.append("target_color", params.targetColor ?? "#264F7A");
  form.append("num_images", String(params.numImages ?? 1));
  form.append("enhance_prompt", "false");
  form.append("change_strength", String(DEFAULT_EDIT_STRENGTH));
  form.append("reference_strength", String(DEFAULT_REFERENCE_STRENGTH));
  form.append("prompt_strength", String(DEFAULT_PROMPT_STRENGTH));

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
  form.append("change_strength", String(DEFAULT_EDIT_STRENGTH));
  form.append("reference_strength", String(DEFAULT_REFERENCE_STRENGTH));
  form.append("prompt_strength", String(DEFAULT_PROMPT_STRENGTH));
  form.append("num_images", String(params.numImages ?? 1));
  form.append("enhance_prompt", "false");

  return form;
}

function getBackendPreset(preset: PresetId) {
  if (preset === "monotone" || preset === "pastel" || preset === "natural" || preset === "natural_white") {
    return preset;
  }

  if (preset === "dusty" || preset === "dark_dusty") return "dark_dusty";
  if (["fresh", "candy", "ice_cream", "kids"].includes(preset)) return "pastel";
  if (preset === "mens_casual" || preset === "womens_casual") return "natural";
  if (
    preset === "mens_formal" ||
    preset === "mens_party" ||
    preset === "mens_ethnic" ||
    preset === "womens_formal" ||
    preset === "womens_party"
  ) {
    return "dark";
  }
  if (["home_decor", "home_furnishing", "wallpaper", "earthy"].includes(preset)) return "natural";
  if (preset.startsWith("dark_") || preset === "dark") return "dark";
  return "natural";
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

    if (Array.isArray(payload.detail)) {
      const messages = payload.detail
        .map((item) => {
          if (!item || typeof item !== "object") return "";

          const entry = item as Record<string, unknown>;
          const loc = Array.isArray(entry.loc)
            ? entry.loc
                .map((part) => (typeof part === "string" || typeof part === "number" ? String(part) : ""))
                .filter(Boolean)
                .join(".")
                .replace(/^body\./, "")
            : "";
          const msg = typeof entry.msg === "string" ? entry.msg.trim() : "";

          if (loc && msg) return `${loc}: ${msg}`;
          return loc || msg;
        })
        .filter(Boolean);

      if (messages.length) {
        return messages.join("; ");
      }
    }

    const detail = payload.detail ?? payload.message ?? payload.error;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }

  return `Request failed with status ${status}`;
}
