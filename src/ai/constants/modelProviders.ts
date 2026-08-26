import type { TextToImageProvider } from "@/api/aiApi";

export type ModelProviderOption = {
  id: TextToImageProvider;
  label: string;
  description: string;
};

export const MODEL_PROVIDER_OPTIONS: ModelProviderOption[] = [
  {
    id: "gemini",
    label: "Gemini",
    description: "Google Gemini image model",
  },
  {
    id: "gpt",
    label: "GPT Image",
    description: "OpenAI GPT Image 2",
  },
];

export const getModelProviderLabel = (provider: TextToImageProvider) =>
  MODEL_PROVIDER_OPTIONS.find((option) => option.id === provider)?.label || "Gemini";
