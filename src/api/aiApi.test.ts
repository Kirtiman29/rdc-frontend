import { describe, expect, it } from "vitest";
import {
  extractGeneratedImageUrls,
  normalizeGeminiImageOutputUrl,
  type AiToolResponse,
} from "./aiApi";

describe("extractGeneratedImageUrls", () => {
  it("prefers outputData.generated_images over the single preview outputUrl", () => {
    const response: AiToolResponse = {
      success: true,
      message: "Generated successfully",
      outputUrl: "http://192.168.0.154:8000/generated/image_1.png",
      outputData: {
        generated_images: [
          {
            filename: "image_1.png",
            image_url: "http://192.168.0.154:8000/generated/image_1.png",
          },
          {
            filename: "image_2.png",
            image_url: "http://192.168.0.154:8000/generated/image_2.png",
          },
        ],
      },
      remainingCredits: 120,
    };

    expect(extractGeneratedImageUrls(response)).toEqual([
      "http://192.168.0.154:8000/generated/image_1.png",
      "http://192.168.0.154:8000/generated/image_2.png",
    ]);
  });

  it("supports image_urls arrays when generated_images is absent", () => {
    const response: AiToolResponse = {
      success: true,
      message: "Generated successfully",
      outputUrl: "http://192.168.0.154:8000/generated/image_1.png",
      outputData: {
        image_urls: [
          "http://192.168.0.154:8000/generated/image_1.png",
          "http://192.168.0.154:8000/generated/image_2.png",
          "http://192.168.0.154:8000/generated/image_3.png",
        ],
      },
      remainingCredits: 120,
    };

    expect(extractGeneratedImageUrls(response)).toEqual([
      "http://192.168.0.154:8000/generated/image_1.png",
      "http://192.168.0.154:8000/generated/image_2.png",
      "http://192.168.0.154:8000/generated/image_3.png",
    ]);
  });

  it("falls back to outputUrl for older single-image responses", () => {
    const response: AiToolResponse = {
      success: true,
      message: "Generated successfully",
      outputUrl: "http://192.168.0.154:8000/generated/image_1.png",
      outputData: null,
      remainingCredits: 120,
    };

    expect(extractGeneratedImageUrls(response)).toEqual([
      "http://192.168.0.154:8000/generated/image_1.png",
    ]);
  });

  it("reads generated_images from stringified outputData payloads", () => {
    const response: AiToolResponse = {
      success: true,
      message: "Generated successfully",
      outputUrl: "http://192.168.0.154:8000/generated/image_1.png",
      outputData: JSON.stringify({
        generated_images: [
          {
            filename: "image_1.png",
            image_url: "http://192.168.0.154:8000/generated/image_1.png",
          },
          {
            filename: "image_2.png",
            image_url: "http://192.168.0.154:8000/generated/image_2.png",
          },
        ],
      }),
      remainingCredits: 120,
    };

    expect(extractGeneratedImageUrls(response)).toEqual([
      "http://192.168.0.154:8000/generated/image_1.png",
      "http://192.168.0.154:8000/generated/image_2.png",
    ]);
  });

  it("rewrites Gemini img-img output URLs from the legacy 8002 host to 8000", () => {
    expect(
      normalizeGeminiImageOutputUrl(
        "http://192.168.0.154:8002/gemini-generated/gemini_i2i_60fbd0210c754e2c9be3eb29d6c0966a.png"
      )
    ).toBe(
      "http://192.168.0.154:8000/gemini-generated/gemini_i2i_60fbd0210c754e2c9be3eb29d6c0966a.png"
    );
  });
});
