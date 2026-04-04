import axios from "axios";
import { applyIndustrialInterceptors, getToken } from "./apiClient";

/* =========================================
   BASE URL (AI SERVICE)
========================================= */
const AI_BASE_URL = `${import.meta.env.VITE_AI_SERVICE_URL}`;

/* =========================================
   AI AXIOS INSTANCE
========================================= */
export const aiApi = axios.create({
  baseURL: AI_BASE_URL,
});

/* =========================================
   APPLY INTERCEPTORS (TOKEN + REFRESH)
========================================= */
applyIndustrialInterceptors(aiApi);

/* =========================================
   TYPES
========================================= */
export interface GenerateResponse {
  status: string;
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
}

export type UpscaleMode = "normal" | "double" | "textile";

export interface UpscaleResponse {
  status: string;
  image: string;        
  generation_id: number; 
}

export interface GenerateSeamlessResponse {
  success: boolean;
  message: string;
  output_image: string;
}

/* =========================================
   GENERATE DESIGN API
========================================= */
export const generateDesign = async (formData: FormData): Promise<GenerateResponse> => {
  // Cast to unknown first to break the AxiosResponse link, then to GenerateResponse
  const res = await aiApi.post<any>("/generate", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return (res as unknown) as GenerateResponse;
};

/* =========================================
   ENHANCE PROMPT API
========================================= */
export const enhancePrompt = async (
  prompt: string,
  file?: File
): Promise<EnhanceResponse> => {
  const formData = new FormData();
  formData.append("user_prompt", prompt);
  if (file) {
    formData.append("file", file);
  }

  const res = await aiApi.post<any>("/enhance-prompt", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return (res as unknown) as EnhanceResponse;
};

/* =========================================
   UPSCALE IMAGE API
========================================= */
export const upscaleImage = async (
  file: File,
  mode: UpscaleMode,
  userId: number
): Promise<UpscaleResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);
  formData.append("user_id", userId.toString());

  const res = await aiApi.post<any>("/upscale", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  return (res as unknown) as UpscaleResponse;
};

export const upscaleBatch = async (
  zipFile: File | Blob,
  mode: string,
  userId: number,
  outputFolder: string = `upscaled_batch_${Date.now()}`
) => {
  const formData = new FormData();

  formData.append("zip_file", zipFile, "upload.zip");
  formData.append("mode", mode);
  formData.append("user_id", userId.toString());
  formData.append("output_folder", outputFolder);

  const token = getToken();

  // 🔥 IMPORTANT: NO aiApi (no interceptor)
  const res = await axios.post(
    `${import.meta.env.VITE_AI_SERVICE_URL}/batch-upscale`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: "blob", // 🔥 MUST
    }
  );

  return res.data; // 🔥 return blob directly
};

/* =========================================
   GENERATE SEAMLESS PATTERN API
========================================= */
export const generateSeamlessPattern = async (file: File): Promise<GenerateSeamlessResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await aiApi.post<any>("/pattern/generate-seamless", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  return (res as unknown) as GenerateSeamlessResponse;
};

/* =========================================
   HISTORY API
========================================= */
export const getHistory = async (style?: string) => {
  const params = style && style !== 'all' ? { style } : {};
  const res = await aiApi.get<any>("/api/history", { params });
  return (res as unknown) as any;
};

/* =========================================
   HEALTH CHECK
========================================= */
export const checkAIHealth = async () => {
  return await aiApi.get("/health");
};

/* =========================================
   IMAGE URL HELPER
========================================= */
export const getAIImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  // normalize backslashes to forward slashes for URLs
  const normalizedUrl = url.replace(/\\/g, '/');
  const cleanPath = normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`;
  return `${AI_BASE_URL}${cleanPath}`;
};

export default aiApi;