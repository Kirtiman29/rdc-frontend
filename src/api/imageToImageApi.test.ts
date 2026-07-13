import { describe, expect, it } from "vitest";

import { normalizeBackendImageUrl } from "./imageToImageApi";

const expectedImageBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_AI_SERVICE_URL ||
  "http://192.168.0.154:8000"
).replace(/\/+$/, "");

describe("normalizeBackendImageUrl", () => {
  it("rewrites legacy 8002 output URLs to the primary 8000 image host", () => {
    expect(
      normalizeBackendImageUrl("http://192.168.0.154:8002/gemini-generated/gemini_i2i_cd090aa17b894bedabda46b79dff5144.png")
    ).toBe(`${expectedImageBaseUrl}/gemini-generated/gemini_i2i_cd090aa17b894bedabda46b79dff5144.png`);
  });

  it("leaves already-correct absolute image URLs unchanged", () => {
    expect(
      normalizeBackendImageUrl("http://192.168.0.154:8000/gemini-generated/gemini_i2i_cd090aa17b894bedabda46b79dff5144.png")
    ).toBe(
      "http://192.168.0.154:8000/gemini-generated/gemini_i2i_cd090aa17b894bedabda46b79dff5144.png"
    );
  });
});
