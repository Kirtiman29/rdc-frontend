import {
  GEMINI_IMAGE_MIX_ASPECT_RATIOS,
  getAIImageUrl,
  invokeAiTool,
  uploadAiInputAsset,
  type GenerateResponse,
  type GeminiImageMixAspectRatio,
  type TextToImageProvider,
} from "@/api/aiApi";

type ImageMixProviderOptions = {
  files: File[];
  prompt: string;
  numImages?: number;
  aspectRatio?: GeminiImageMixAspectRatio;
  provider?: TextToImageProvider;
};

type ImageMixGeneratedImage = {
  filename?: string | null;
  image_url?: string | null;
  url?: string | null;
};

type ImageMixOutputData = {
  generated_images?: ImageMixGeneratedImage[] | null;
  image_urls?: string[] | null;
  output_url?: string | null;
  model?: string | null;
  provider?: string | null;
  requested_provider?: string | null;
  provider_fallback_used?: boolean | null;
  fallback_provider?: string | null;
};

const assertImageMixAspectRatio = (
  aspectRatio: string
): GeminiImageMixAspectRatio => {
  if (GEMINI_IMAGE_MIX_ASPECT_RATIOS.includes(aspectRatio as GeminiImageMixAspectRatio)) {
    return aspectRatio as GeminiImageMixAspectRatio;
  }

  throw new Error("Invalid aspect_ratio for Gemini image mix.");
};

const collectImageUrls = (data: ImageMixOutputData | null, outputUrl: string | null) => {
  const urls: string[] = [];

  data?.generated_images?.forEach((image) => {
    const url = image.image_url || image.url;
    if (url) {
      urls.push(url);
    }
  });

  data?.image_urls?.forEach((url) => {
    if (url) {
      urls.push(url);
    }
  });

  if (data?.output_url) {
    urls.push(data.output_url);
  }

  if (outputUrl) {
    urls.push(outputUrl);
  }

  return [...new Set(urls)].map(getAIImageUrl);
};

export const generateImageMixWithProvider = async ({
  files,
  prompt,
  numImages = 1,
  aspectRatio = "1:1",
  provider = "gemini",
}: ImageMixProviderOptions): Promise<GenerateResponse> => {
  if (files.length < 2 || files.length > 3) {
    throw new Error("Gemini image mix requires 2 or 3 input images.");
  }

  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new Error("prompt is required for Gemini image mix.");
  }

  const inputUrls = await Promise.all(files.map((file) => uploadAiInputAsset(file)));
  const response = await invokeAiTool<ImageMixOutputData>({
    toolName: "GEMINI_IMAGE_MIX",
    inputUrl: null,
    params: {
      inputUrls,
      prompt: trimmedPrompt,
      num_images: numImages,
      aspect_ratio: assertImageMixAspectRatio(aspectRatio),
      provider,
    },
  });

  const outputData = response.outputData;
  const urls = collectImageUrls(outputData, response.outputUrl);

  return {
    status: response.success ? "success" : "error",
    remainingCredits: response.remainingCredits,
    provider: outputData?.provider ?? provider,
    requestedProvider: outputData?.requested_provider ?? provider,
    providerFallbackUsed: Boolean(outputData?.provider_fallback_used),
    fallbackProvider: outputData?.fallback_provider ?? null,
    images: urls.map((url, index) => ({
      id: index + 1,
      filename:
        outputData?.generated_images?.[index]?.filename ||
        `rdc-pattern-mix-${index + 1}.png`,
      url,
      input_image: "",
      style: "mix",
    })),
  };
};
