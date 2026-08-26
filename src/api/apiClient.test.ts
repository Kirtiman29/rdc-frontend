import { describe, expect, it } from "vitest";
import { getAssetUrl } from "./apiClient";

const ASSET_DOWNLOAD_URL =
  "http://localhost:8090/api/assets/download/3fb70aee-ca7f-4f36-a8d7-8dd1f7117845";

describe("getAssetUrl", () => {
  it("does not duplicate asset download paths returned by the asset service", () => {
    expect(getAssetUrl("/api/assets/download/3fb70aee-ca7f-4f36-a8d7-8dd1f7117845")).toBe(ASSET_DOWNLOAD_URL);
  });

  it("repairs already duplicated asset download paths", () => {
    expect(
      getAssetUrl("/api/assets/download//api/assets/download/3fb70aee-ca7f-4f36-a8d7-8dd1f7117845")
    ).toBe(ASSET_DOWNLOAD_URL);
  });

  it("rewrites stale absolute asset download hosts to the active local asset base", () => {
    expect(
      getAssetUrl(
        "https://attribute-remained-match-pensions.trycloudflare.com/api/assets/download/3fb70aee-ca7f-4f36-a8d7-8dd1f7117845"
      )
    ).toBe(ASSET_DOWNLOAD_URL);
  });
});
