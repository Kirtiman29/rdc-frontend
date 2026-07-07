import axios from "axios";

import { getToken } from "@/api/apiClient";

export type HistorySourceFilter = "all" | "ai" | "gemini";
export type HistoryItemSource = "ai_generation" | "gemini_generation";

export interface HistoryItem {
  id: number;
  source: HistoryItemSource;
  prompt?: string | null;
  input_prompt?: string | null;
  final_prompt?: string | null;
  style?: string | null;
  aspect_ratio?: string | null;
  image_url: string;
  input_image_url?: string | null;
  created_at: string;
  model?: string | null;
  prompt_model?: string | null;
  prompt_enhanced?: boolean | null;
  fallback_used?: boolean | null;
}

export interface HistoryResponse {
  status: "success";
  total: number;
  source: HistorySourceFilter;
  limit: number;
  offset: number;
  data: HistoryItem[];
}

export type FetchHistoryParams = {
  source?: HistorySourceFilter;
  style?: string;
  limit?: number;
  offset?: number;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const SUBSCRIPTION_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL || "http://localhost:8094"
);

const HISTORY_URL = `${SUBSCRIPTION_BASE_URL}/api/history`;

const getHistoryToken = () => getToken() || localStorage.getItem("token");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toNullableString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toBoolean = (value: unknown) => value === true || value === "true" || value === 1 || value === "1";

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeHistoryItem = (value: unknown): HistoryItem => {
  const record = isRecord(value) ? value : {};

  return {
    id:
      typeof record.id === "number"
        ? record.id
        : Number.isFinite(Number(record.id))
          ? Number(record.id)
          : 0,
    source:
      record.source === "ai_generation" || record.source === "gemini_generation"
        ? record.source
        : "ai_generation",
    prompt: toNullableString(record.prompt),
    input_prompt: toNullableString(record.input_prompt),
    final_prompt: toNullableString(record.final_prompt),
    style: toNullableString(record.style),
    aspect_ratio: toNullableString(record.aspect_ratio),
    image_url: typeof record.image_url === "string" ? record.image_url : "",
    input_image_url: toNullableString(record.input_image_url),
    created_at: typeof record.created_at === "string" ? record.created_at : new Date().toISOString(),
    model: toNullableString(record.model),
    prompt_model: toNullableString(record.prompt_model),
    prompt_enhanced:
      typeof record.prompt_enhanced === "boolean" ? record.prompt_enhanced : toBoolean(record.prompt_enhanced),
    fallback_used:
      typeof record.fallback_used === "boolean" ? record.fallback_used : toBoolean(record.fallback_used),
  };
};

const normalizeHistoryResponse = (payload: unknown): HistoryResponse => {
  const record = isRecord(payload) ? payload : {};
  const rawData =
    Array.isArray(payload)
      ? payload
      : Array.isArray(record.data)
        ? record.data
        : Array.isArray(record.items)
          ? record.items
          : Array.isArray(record.history)
            ? record.history
            : Array.isArray(record.content)
              ? record.content
              : [];

  const source =
    record.source === "all" || record.source === "ai" || record.source === "gemini"
      ? record.source
      : "all";

  return {
    status: "success",
    total:
      typeof record.total === "number"
        ? record.total
        : Number.isFinite(Number(record.total))
          ? Number(record.total)
          : rawData.length,
    source,
    limit:
      typeof record.limit === "number"
        ? record.limit
        : Number.isFinite(Number(record.limit))
          ? Number(record.limit)
          : 20,
    offset:
      typeof record.offset === "number"
        ? record.offset
        : Number.isFinite(Number(record.offset))
          ? Number(record.offset)
          : 0,
    data: rawData.map((item) => normalizeHistoryItem(item)),
  };
};

export const fetchHistory = async ({
  source = "all",
  style,
  limit = 20,
  offset = 0,
}: FetchHistoryParams = {}): Promise<HistoryResponse> => {
  const token = getHistoryToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await axios.get(HISTORY_URL, {
    headers,
    params: {
      source,
      style,
      limit: clampNumber(limit, 1, 100),
      offset: Math.max(0, offset),
    },
  });

  return normalizeHistoryResponse(res.data);
};

export const getApiErrorMessage = (err: unknown) => {
  const error = err as {
    response?: { data?: { detail?: string; message?: string } };
  };

  return error?.response?.data?.detail || error?.response?.data?.message || "Something went wrong";
};
