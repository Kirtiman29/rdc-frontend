import {
  getAIImageUrl,
  invokeAiTool,
  uploadAiInputAsset,
  type GenerateSeamlessResponse,
  type TextToImageProvider,
} from "@/api/aiApi";

export const generatePatternExtractorWithProvider = async (
  file: File,
  provider: TextToImageProvider
): Promise<GenerateSeamlessResponse> => {
  const inputUrl = await uploadAiInputAsset(file);
  const response = await invokeAiTool({
    toolName: "PATTERN_GENERATOR",
    inputUrl,
    params: {
      provider,
    },
  });

  const outputData = response.outputData as
    | {
        output_url?: string;
        image_url?: string;
        output_image?: string;
      }
    | null
    | undefined;
  const outputImage = getAIImageUrl(
    response.outputUrl ||
      outputData?.output_url ||
      outputData?.image_url ||
      outputData?.output_image ||
      ""
  );

  return {
    success: response.success && Boolean(outputImage),
    message: response.message,
    output_image: outputImage,
    tile_url: outputImage,
    remainingCredits: response.remainingCredits,
  };
};
