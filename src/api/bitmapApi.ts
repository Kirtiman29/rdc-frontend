import { getToken } from "@/api/apiClient";

type BitmapParamValue = string | number | boolean | null | undefined;
type BitmapParamMap = Record<string, BitmapParamValue>;

export type BitmapUploadResponse = {
  message: string;
  filename: string;
  path: string;
  sizeBytes: number;
  bitmapId: number | null;
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
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolveBitmapBaseUrl = () => {
  const envBase = trimTrailingSlash(import.meta.env.VITE_BITMAP_SERVICE_URL || "");
  if (envBase) {
    return envBase;
  }

  if (import.meta.env.DEV) {
    return "/api/bitmap";
  }

  return "https://ruchitadesigncompany.in/api/bitmap";
};

const BITMAP_BASE_URL = resolveBitmapBaseUrl();

const buildBitmapUrl = (path: string) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BITMAP_BASE_URL}${cleanPath}`;
};

const getAuthHeaders = (token?: string) => {
  const accessToken = token || getToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const toFormBody = (params: BitmapParamMap) => {
  const formBody = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formBody.append(key, String(value));
  });

  return formBody;
};

const createBitmapError = async (response: Response) => {
  const rawBody = await response.text().catch(() => "");
  let payload: unknown = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = rawBody;
    }
  }

  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const bodyText =
    typeof payload === "string"
      ? payload
      : typeof rawBody === "string" && rawBody.trim()
        ? rawBody.trim()
        : "";
  const message =
    (record && typeof record.message === "string" && record.message) ||
    (record && typeof record.detail === "string" && record.detail) ||
    (record && typeof record.error === "string" && record.error) ||
    bodyText ||
    `Bitmap request failed (${response.status})`;

  const error = new Error(message);
  (error as Error & { status?: number }).status = response.status;
  return error;
};

const fetchBitmap = async (path: string, init: RequestInit) => {
  const attempt = async (candidatePath: string) => fetch(buildBitmapUrl(candidatePath), init);
  const firstResponse = await attempt(path);

  if (firstResponse.ok) {
    return firstResponse;
  }

  const shouldRetryWithTrailingSlash =
    firstResponse.status === 404 || firstResponse.status === 405;
  const alternatePath = path.endsWith("/") ? path.replace(/\/+$/, "") : `${path}/`;

  if (shouldRetryWithTrailingSlash && alternatePath !== path) {
    const secondResponse = await attempt(alternatePath);
    if (secondResponse.ok) {
      return secondResponse;
    }
    throw await createBitmapError(secondResponse);
  }

  throw await createBitmapError(firstResponse);
};

const normalizeUploadResponse = (payload: unknown): BitmapUploadResponse => {
  const record = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;

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
  };
};

const normalizeAnalysisResponse = (payload: unknown): BitmapAnalysisResponse => {
  const record = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const analysisRecord = (record.analysis && typeof record.analysis === "object"
    ? record.analysis
    : {}) as Record<string, unknown>;

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
  };
};

const postForm = async (path: string, params: BitmapParamMap, token?: string) => {
  const response = await fetchBitmap(path, {
    method: "POST",
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toFormBody(params),
  });

  return response;
};

export const bitmapApi = {
  async health(token?: string) {
    const response = await fetchBitmap("/health", {
      method: "GET",
      headers: {
        ...getAuthHeaders(token),
      },
    });

    return response.ok;
  },

  async upload(file: File, token?: string) {
    const response = await fetchBitmap("/upload", {
      method: "POST",
      headers: {
        ...getAuthHeaders(token),
      },
      body: (() => {
        const formData = new FormData();
        formData.append("file", file);
        return formData;
      })(),
    });

    if (!response.ok) {
      throw await createBitmapError(response);
    }

    return normalizeUploadResponse(await response.json());
  },

  async analyze(filename: string, token?: string) {
    const response = await postForm("/analyze", { filename }, token);
    return normalizeAnalysisResponse(await response.json());
  },

  async previewHalftone(params: BitmapParamMap, token?: string) {
    const response = await postForm("/preview/halftone", params, token);
    return response.blob();
  },

  async previewDither(params: BitmapParamMap, token?: string) {
    const response = await postForm("/preview/dither", params, token);
    return response.blob();
  },

  async previewSeparationProof(params: BitmapParamMap, token?: string) {
    const response = await postForm("/preview/separation-proof", params, token);
    return response.blob();
  },

  async exportSeparationZip(params: BitmapParamMap, token?: string) {
    const response = await postForm("/export/separation-zip", params, token);
    return response.blob();
  },

  async exportPsd(params: BitmapParamMap, token?: string) {
    const response = await postForm("/export/psd", params, token);
    return response.blob();
  },

  async exportCmyk(params: BitmapParamMap, token?: string) {
    const response = await postForm("/export/cmyk", params, token);
    return response.blob();
  },
};
