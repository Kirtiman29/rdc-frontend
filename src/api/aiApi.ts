import axios from "axios";
import { applyIndustrialInterceptors } from "./apiClient";

/* =========================================
   BASE URL (AI SERVICE)
========================================= */
const AI_BASE_URL = `${import.meta.env.VITE_AI_SERVICE_URL}`.replace(
  /([^:]\/)\/+/g,
  "$1"
);

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

  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${AI_BASE_URL}${cleanPath}`;
};

export default aiApi;