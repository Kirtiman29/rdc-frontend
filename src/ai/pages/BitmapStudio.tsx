import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  CloudUpload,
  Download,
  FileImage,
  ImageUp,
  Layers3,
  Loader2,
  Palette,
  ScanLine,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  Wand2,
} from "lucide-react";

import { getToken } from "@/api/apiClient";
import { bitmapApi, type BitmapUploadResponse } from "@/api/bitmapApi";

type Notice = {
  type: "info" | "success" | "error";
  text: string;
} | null;

type BitmapPresetId = "luxury-fabric" | "soft-vintage" | "embroidery" | "newspaper" | "sharp-print" | "custom";
type WorkflowMode = "single" | "multicolor";
type HalftoneShape = "circle" | "square" | "diamond" | "line";
type DitherAlgorithm = "floyd-steinberg" | "atkinson" | "bayer4" | "threshold";

const DEFAULT_MANUAL_SPOT_COLORS = "#f7d7dc,#e8a9b4,#c86f84,#8d4259";

const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"];
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff"];
const DEFAULT_SCREEN_DPI_OPTIONS = ["300", "520", "600"];

const presetCards: Array<{
  id: BitmapPresetId;
  title: string;
  badge: string;
  description: string;
  accent: string;
}> = [
  {
    id: "luxury-fabric",
    title: "Luxury Fabric",
    badge: "Stipple / Print",
    description: "Rich contrast and cleaner edges for premium textile artwork.",
    accent: "#E11D2E",
  },
  {
    id: "soft-vintage",
    title: "Soft Vintage",
    badge: "Halftone / Retro",
    description: "A softer dot screen for warm poster-style imagery.",
    accent: "#3B82F6",
  },
  {
    id: "embroidery",
    title: "Embroidery",
    badge: "Bayer Matrix",
    description: "Structured bitmap output with a stitched, production-friendly feel.",
    accent: "#14B8A6",
  },
  {
    id: "newspaper",
    title: "Newspaper",
    badge: "Coarse Dot",
    description: "Bold editorial screening with a crisp, high-visibility finish.",
    accent: "#F59E0B",
  },
  {
    id: "sharp-print",
    title: "Sharp Print",
    badge: "Threshold / Line",
    description: "Clean hard edges for logos, labels, and dense line work.",
    accent: "#A855F7",
  },
];

const shapeOptions: HalftoneShape[] = ["circle", "square", "diamond", "line"];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const spacingFromFrequency = (frequency: number) => clamp(32 - frequency * 0.3, 5, 30);

const getPresetDitherAlgorithm = (preset: BitmapPresetId): DitherAlgorithm => {
  switch (preset) {
    case "luxury-fabric":
      return "floyd-steinberg";
    case "embroidery":
      return "bayer4";
    case "sharp-print":
      return "threshold";
    default:
      return "atkinson";
  }
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const stripFileExtension = (name: string) => name.replace(/\.[^.]+$/, "");

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (/subscription/i.test(error.message)) {
      return "An active subscription is required to use Bitmap Studio.";
    }

    if (/unauthorized|401/i.test(error.message)) {
      return "Please sign in to upload and process bitmap files.";
    }

    return error.message;
  }

  return "Bitmap request failed.";
};

const buildPresets = (preset: BitmapPresetId, intensity: number, fileId: string) => {
  switch (preset) {
    case "luxury-fabric":
      return {
        endpoint: "dither" as const,
        params: {
          filename: fileId,
          algorithm: "floyd-steinberg",
          contrast: Number((34 + intensity * 0.5).toFixed(2)),
          brightness: Number((-10 + (50 - intensity) * 0.08).toFixed(2)),
          preprocess: "textile_print",
          edge_strength: Number((50 + intensity * 0.32).toFixed(2)),
          ink_boost: Number((28 + intensity * 0.35).toFixed(2)),
          background_cleanup: true,
          dpi: 300,
        },
      };
    case "soft-vintage": {
      const spacing = 6 + intensity * 0.2;
      return {
        endpoint: "halftone" as const,
        params: {
          filename: fileId,
          spacing: Number(spacing.toFixed(2)),
          dot_size: Number((spacing * 0.82).toFixed(2)),
          angle: 45,
          shape: "circle",
          grayscale_mode: "luminance_bt709",
          brightness: -4,
          contrast: 18,
          preprocess: "textile_print",
          edge_strength: 42,
          ink_boost: 22,
          background_cleanup: true,
          binarize: true,
          dpi: 300,
        },
      };
    }
    case "embroidery":
      return {
        endpoint: "dither" as const,
        params: {
          filename: fileId,
          algorithm: "bayer4",
          contrast: 28,
          brightness: -2,
          preprocess: "textile_print",
          edge_strength: 48,
          ink_boost: 30,
          background_cleanup: true,
          dpi: 300,
        },
      };
    case "newspaper": {
      const spacing = 12 + intensity * 0.22;
      return {
        endpoint: "halftone" as const,
        params: {
          filename: fileId,
          spacing: Number(spacing.toFixed(2)),
          dot_size: Number((4 + intensity * 0.04).toFixed(2)),
          angle: 15,
          shape: "square",
          grayscale_mode: "luminance_bt709",
          brightness: 0,
          contrast: 10,
          preprocess: "textile_print",
          edge_strength: 34,
          ink_boost: 18,
          background_cleanup: true,
          binarize: true,
          dpi: 300,
        },
      };
    }
    case "sharp-print":
      return {
        endpoint: "dither" as const,
        params: {
          filename: fileId,
          algorithm: "threshold",
          threshold_val: Math.round(24 + intensity * 2),
          contrast: 42,
          brightness: -8,
          preprocess: "textile_print",
          edge_strength: 58,
          ink_boost: 34,
          background_cleanup: true,
          dpi: 300,
        },
      };
    default:
      return null;
  }
};

const buildCustomParams = ({
  fileId,
  workflowMode,
  dotScreenEnabled,
  grayscaleEnabled,
  spotColorCount,
  manualSpotColors,
  frequency,
  angle,
  dotShape,
  dotSize,
  dpi,
  intensity,
}: {
  fileId: string;
  workflowMode: WorkflowMode;
  dotScreenEnabled: boolean;
  grayscaleEnabled: boolean;
  spotColorCount: number;
  manualSpotColors: string;
  frequency: number;
  angle: number;
  dotShape: HalftoneShape;
  dotSize: number;
  dpi: number;
  intensity: number;
}) => ({
  filename: fileId,
  workflow_mode: workflowMode,
  dot_screen_enabled: dotScreenEnabled,
  grayscale_mode: grayscaleEnabled ? "luminance_bt709" : "average",
  spot_color_count: spotColorCount,
  manual_spot_colors: manualSpotColors,
  contrast: Number((14 + intensity * 0.22).toFixed(2)),
  brightness: Number((-4 + (50 - intensity) * 0.04).toFixed(2)),
  preprocess: "textile_print",
  edge_strength: Number((38 + intensity * 0.28).toFixed(2)),
  ink_boost: Number((18 + intensity * 0.2).toFixed(2)),
  background_cleanup: true,
  dpi,
  dot_size: Number((spacingFromFrequency(frequency) * (dotSize / 100)).toFixed(2)),
  spacing: Number(spacingFromFrequency(frequency).toFixed(2)),
  angle: Number(angle.toFixed(2)),
  shape: dotShape,
  binarize: true,
  frequency: Number(frequency.toFixed(2)),
});

export default function BitmapStudio() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<BitmapUploadResponse | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [resultPreviewUrl, setResultPreviewUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isDownloadingPsd, setIsDownloadingPsd] = useState(false);
  const workflowMode: WorkflowMode = "multicolor";
  const [dotScreenEnabled, setDotScreenEnabled] = useState(true);
  const [grayscaleEnabled, setGrayscaleEnabled] = useState(true);
  const [spotColorCount, setSpotColorCount] = useState(6);
  const [manualSpotColors, setManualSpotColors] = useState(DEFAULT_MANUAL_SPOT_COLORS);
  const [preset, setPreset] = useState<BitmapPresetId>("luxury-fabric");
  const [intensity, setIntensity] = useState(50);
  const [frequency, setFrequency] = useState(40);
  const [angle, setAngle] = useState(45);
  const [dotSize, setDotSize] = useState(85);
  const [dpi, setDpi] = useState(300);
  const [screenDpiOptions, setScreenDpiOptions] = useState<string[]>(DEFAULT_SCREEN_DPI_OPTIONS);
  const [psdDpi, setPsdDpi] = useState(520);
  const [dotShape, setDotShape] = useState<HalftoneShape>("circle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const token = getToken();
  const hasAuth = Boolean(token);
  const currentFileId = uploadResponse?.filename || "";
  const activePreset = presetCards.find((item) => item.id === preset) || presetCards[0];
  const activePresetLabel = preset === "custom" ? "Custom Workspace" : activePreset.title;
  const downloadFileName = `${stripFileExtension(currentFileId || selectedFile?.name || "bitmap")}-preview.png`;
  const psdFileName = `${stripFileExtension(currentFileId || selectedFile?.name || "bitmap")}-${psdDpi}dpi.psd`;

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }

      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }
    };
  }, []);

  const setBanner = (text: string, type: NonNullable<Notice>["type"] = "info") => {
    setNotice({ text, type });
  };

  const clearGeneratedPreview = () => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }

    setResultPreviewUrl(null);
  };

  const setSourcePreview = (file: File) => {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    sourceUrlRef.current = nextUrl;
    setSourcePreviewUrl(nextUrl);
  };

  const syncLocalFile = async (file: File) => {
    setSelectedFile(file);
    setSourcePreview(file);
    clearGeneratedPreview();
    setUploadResponse(null);

    if (!hasAuth) {
      setBanner("Previewing locally only. Sign in to upload and generate backend previews.", "error");
      return;
    }

    try {
      setIsUploading(true);
      setBanner("Uploading artwork to the bitmap workspace...", "info");

      const upload = await bitmapApi.upload(file, token || undefined);
      setUploadResponse(upload);
      setBanner(`Upload complete. Stored filename: ${upload.filename}`, "success");
    } catch (error) {
      setBanner(getErrorMessage(error), "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelection = async (file?: File) => {
    if (!file) return;

    const normalizedName = file.name.toLowerCase();
    const isAllowed =
      ALLOWED_IMAGE_TYPES.includes(file.type) ||
      ALLOWED_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));

    if (!isAllowed) {
      setBanner("Please upload a PNG, JPG, JPEG, WEBP, BMP, TIF, or TIFF image.", "error");
      return;
    }

    const imageDpiRaw = window.prompt("How much DPI is this image?", String(dpi));
    if (imageDpiRaw !== null) {
      const parsedDpi = Number(imageDpiRaw);

      if (!Number.isFinite(parsedDpi) || parsedDpi <= 0) {
        setBanner("Please enter a valid image DPI before uploading.", "error");
        return;
      }

      const normalizedDpi = Math.round(parsedDpi);
      setDpi(normalizedDpi);
      setScreenDpiOptions((currentOptions) => {
        const nextOption = String(normalizedDpi);
        if (currentOptions.includes(nextOption)) {
          return currentOptions;
        }

        return [...currentOptions, nextOption].sort((left, right) => Number(left) - Number(right));
      });
      setBanner(`Image DPI set to ${normalizedDpi}.`, "info");
    }

    await syncLocalFile(file);
  };

  const buildActiveRequest = () => {
    if (!currentFileId) {
      return null;
    }

    const selectedSpacing = Number(spacingFromFrequency(frequency).toFixed(2));
    const selectedDotSize = Number((selectedSpacing * (dotSize / 100)).toFixed(2));
    const proofOverrides = {
      algorithm: dotScreenEnabled ? "halftone" : "dither",
      dither_algo: dotScreenEnabled ? "atkinson" : getPresetDitherAlgorithm(preset),
      shape: dotShape,
      spacing: selectedSpacing,
      dot_size: selectedDotSize,
      angle: Number(angle.toFixed(2)),
      dpi,
      workflow_mode: workflowMode,
      dot_screen_enabled: dotScreenEnabled,
      spot_color_count: spotColorCount,
      manual_spot_colors: manualSpotColors,
    };

    if (preset === "custom") {
      return {
        endpoint: "separationProof" as const,
        params: {
          ...buildCustomParams({
            fileId: currentFileId,
            workflowMode,
            dotScreenEnabled,
            grayscaleEnabled,
            spotColorCount,
            manualSpotColors,
            frequency,
            angle,
            dotShape,
            dotSize,
            dpi,
            intensity,
          }),
          ...proofOverrides,
        },
      };
    }

    const presetRequest = buildPresets(preset, intensity, currentFileId);
    if (!presetRequest) {
      return null;
    }

    return {
      endpoint: "separationProof" as const,
      params: {
        ...presetRequest.params,
        ...proofOverrides,
      },
    };
  };

  const requestPreview = async () => {
    if (!currentFileId) {
      setBanner("Upload an image before generating a preview.", "error");
      return;
    }

    if (!hasAuth) {
      setBanner("Please sign in to generate bitmap previews from the backend.", "error");
      return;
    }

    try {
      setIsRendering(true);
      clearGeneratedPreview();
      setBanner("Generating bitmap preview...", "info");

      const request = buildActiveRequest();

      if (!request) {
        setBanner("Could not build a bitmap preview request.", "error");
        return;
      }

      let blob: Blob;
      switch (request.endpoint) {
        case "separationProof":
          blob = await bitmapApi.previewSeparationProof(request.params, token || undefined);
          break;
        default:
          blob = await bitmapApi.previewDither(request.params, token || undefined);
      }

      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }

      const nextPreviewUrl = URL.createObjectURL(blob);
      resultUrlRef.current = nextPreviewUrl;
      setResultPreviewUrl(nextPreviewUrl);
      setBanner("Preview ready for review.", "success");
    } catch (error) {
      setBanner(getErrorMessage(error), "error");
    } finally {
      setIsRendering(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.rel = "noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  const downloadPsd = async () => {
    if (!currentFileId) {
      setBanner("Upload an image before downloading a PSD.", "error");
      return;
    }

    if (!hasAuth) {
      setBanner("Please sign in to download PSD exports from the backend.", "error");
      return;
    }

    try {
      setIsDownloadingPsd(true);
      setBanner(`Preparing ${psdDpi} DPI layered PSD...`, "info");

      const request = buildActiveRequest();

      if (!request) {
        setBanner("Could not build a PSD export request.", "error");
        return;
      }

      const blob = await bitmapApi.exportPsd({ ...request.params, dpi: psdDpi }, token || undefined);
      downloadBlob(blob, psdFileName);
      setBanner(`${psdDpi} DPI PSD download started.`, "success");
    } catch (error) {
      setBanner(getErrorMessage(error), "error");
    } finally {
      setIsDownloadingPsd(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#111315] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[520px] w-[520px] rounded-full bg-[#E11D2E]/10 blur-[160px]" />
        <div className="absolute right-[-12%] top-[8%] h-[460px] w-[460px] rounded-full bg-[#3B82F6]/8 blur-[150px]" />
        <div className="absolute bottom-[-12%] left-[18%] h-[420px] w-[420px] rounded-full bg-white/5 blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px] opacity-[0.12]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1480px] flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
        <header className="flex flex-col gap-6 border-b border-white/5 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#A1A8B3]">
              <Sparkles className="h-3.5 w-3.5 text-[#E11D2E]" />
              RDC AI Studio / Bitmap
            </div>
            <div>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">Bitmap Studio</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A1A8B3] md:text-base">
                Professional bitmap prep with only the controls that matter for textile production.
              </p>
              <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-[#A1A8B3]">
                Subscription access only. No AI credits or design quota are consumed.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E11D2E] px-5 text-sm font-semibold text-white transition hover:bg-[#ff3347]"
            >
              <CloudUpload className="h-4 w-4" />
              Upload Artwork
            </button>
            <Link
              to="/ai-studio/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-[#A1A8B3] transition hover:border-[#E11D2E]/40 hover:text-white"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {notice && (
          <div
            className={`inline-flex max-w-3xl items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                : notice.type === "error"
                  ? "border-[#E11D2E]/25 bg-[#E11D2E]/10 text-[#ffb4b9]"
                  : "border-white/10 bg-white/[0.04] text-[#D1D5DB]"
            }`}
          >
            <BadgeCheck className="h-4 w-4 shrink-0" />
            <span>{notice.text}</span>
          </div>
        )}

        {!hasAuth && (
          <div className="rounded-2xl border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-4 py-3 text-sm text-[#ffb4b9]">
            You can preview the local file, but backend upload and rendering require an authenticated session.
          </div>
        )}

        <main className="grid gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
          <aside className="min-h-0 space-y-6 lg:self-start">
            <Panel
              title="1. Design Asset"
              description="Upload a source file. The stored filename powers every later preview request."
              icon={<CloudUpload className="h-4 w-4" />}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,image/png,image/jpeg,image/webp,image/bmp,image/tiff"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  void handleFileSelection(file || undefined);
                  event.currentTarget.value = "";
                }}
              />

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) {
                    void handleFileSelection(file);
                  }
                }}
                className={`group rounded-3xl border border-dashed p-6 transition ${
                  isDragOver
                    ? "border-[#E11D2E]/50 bg-[#E11D2E]/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                <div className="grid gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.3em] text-[#A1A8B3]">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">PNG / JPG / WEBP / BMP</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">Stored filename workflow</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">JWT protected</span>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#0E1012] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Selected File</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {selectedFile ? selectedFile.name : "Drop a file or click Browse to begin"}
                          </p>
                        </div>
                        {selectedFile && (
                          <button
                            type="button"
                            onClick={() => {
                              if (sourceUrlRef.current) {
                                URL.revokeObjectURL(sourceUrlRef.current);
                                sourceUrlRef.current = null;
                              }

                              clearGeneratedPreview();
                              setSelectedFile(null);
                              setUploadResponse(null);
                              setSourcePreviewUrl(null);
                            }}
                            className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-[#A1A8B3] transition hover:border-[#E11D2E]/30 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {selectedFile && (
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#A1A8B3]">
                          <InfoRow label="Type" value={selectedFile.type || "Unknown"} />
                          <InfoRow label="Size" value={formatBytes(selectedFile.size)} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[#0E1012] p-3">
                    <div className="mb-3 flex items-center justify-between px-1 text-[10px] uppercase tracking-[0.3em] text-[#6B7280]">
                      <span>Source Preview</span>
                      <span>{sourcePreviewUrl ? "Loaded" : "Empty"}</span>
                    </div>
                    <div className="relative h-56 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
                      {sourcePreviewUrl ? (
                        <img
                          src={sourcePreviewUrl}
                          alt="Bitmap source preview"
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-sm text-[#6B7280]">
                          <div className="space-y-2">
                            <ImageUp className="mx-auto h-8 w-8 text-[#E11D2E]" />
                            <p>Preview appears here after upload.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title="2. Bitmap Style Preset"
              description="Choose a concise preset that matches the target print style."
              icon={<Layers3 className="h-4 w-4" />}
            >
              <div className="space-y-3">
                {presetCards.map((item) => {
                  const selected = preset === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPreset(item.id)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        selected
                          ? "border-[#E11D2E]/35 bg-[#E11D2E]/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#A1A8B3]">{item.badge}</p>
                        </div>
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-2xl border"
                          style={{
                            color: item.accent,
                            borderColor: selected ? `${item.accent}55` : "rgba(255,255,255,0.08)",
                            backgroundColor: selected ? `${item.accent}15` : "rgba(255,255,255,0.04)",
                          }}
                        >
                          <Wand2 className="h-4 w-4" />
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-6 text-[#A1A8B3]">{item.description}</p>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPreset("custom")}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    preset === "custom"
                      ? "border-[#E11D2E]/35 bg-[#E11D2E]/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Custom Workspace</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#A1A8B3]">Manual control</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#A1A8B3]">
                      <SlidersHorizontal className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[#A1A8B3]">
                    Keep the preset stack lean and move into manual control only when you need it.
                  </p>
                </button>
              </div>
            </Panel>

            <Panel
              title="3. Print Customization"
              description="Only the production controls stay visible."
              icon={<ScanLine className="h-4 w-4" />}
            >
              <div className="space-y-5">
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                    <div className="mb-2 px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#6B7280]">
                      Workflow Mode
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#0E1012] px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Multi-Color</p>
                          <p className="text-xs text-[#A1A8B3]">Single-color mode has been removed.</p>
                        </div>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-200">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <span>
                        <span className="block text-sm font-semibold text-white">Dot Screen</span>
                        <span className="text-xs text-[#A1A8B3]">Enable halftone bitmap conversion.</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={dotScreenEnabled}
                        onChange={(event) => setDotScreenEnabled(event.target.checked)}
                        className="h-5 w-5 rounded border-white/20 bg-transparent accent-[#E11D2E]"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <span>
                        <span className="block text-sm font-semibold text-white">Grayscale</span>
                        <span className="text-xs text-[#A1A8B3]">Use smooth gray separations for print.</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={grayscaleEnabled}
                        onChange={(event) => setGrayscaleEnabled(event.target.checked)}
                        className="h-5 w-5 rounded border-white/20 bg-transparent accent-[#E11D2E]"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <LabeledSelect
                    label="Screen DPI"
                    value={String(dpi)}
                    options={screenDpiOptions}
                    onChange={(value) => setDpi(Number(value))}
                  />
                  <RangeField label="Shading Balance" value={intensity} min={0} max={100} onChange={setIntensity} unit="%" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <RangeField label="Frequency" value={frequency} min={20} max={90} onChange={setFrequency} unit="LPI" />
                  <RangeField label="Dot Size" value={dotSize} min={0} max={100} onChange={setDotSize} unit="%" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <RangeField label="Angle" value={angle} min={0} max={90} onChange={setAngle} unit="deg" />

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">Dot Shape</span>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                      {shapeOptions.map((shape) => {
                        const active = dotShape === shape;
                        return (
                          <button
                            key={shape}
                            type="button"
                            onClick={() => setDotShape(shape)}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                              active ? "bg-[#E11D2E] text-white" : "text-[#A1A8B3] hover:text-white"
                            }`}
                          >
                            {shape}
                          </button>
                        );
                      })}
                    </div>
                  </label>
                </div>

                {workflowMode === "multicolor" && (
                  <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Color Separation</p>
                        <p className="text-xs text-[#A1A8B3]">Keep the stack lean and readable.</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#A1A8B3]">
                        Optional
                      </span>
                    </div>

                    <RangeField
                      label="Layers"
                      value={spotColorCount}
                      min={1}
                      max={8}
                      onChange={setSpotColorCount}
                    />
                    <span className="text-xs text-[#6B7280]">
                      This counts artwork color layers only. Base and patch layers are added separately.
                    </span>

                    <label className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                        Manual Spot Colors
                      </span>
                      <textarea
                        value={manualSpotColors}
                        onChange={(event) => setManualSpotColors(event.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-white/10 bg-[#0E1012] px-3 py-2 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
                        placeholder="#f7d7dc,#e8a9b4,#c86f84,#8d4259"
                      />
                      <span className="text-xs text-[#6B7280]">
                        Use comma-separated hex values for the separation stack.
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={requestPreview}
                  disabled={!currentFileId || isRendering || isUploading || !hasAuth}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E11D2E] px-5 text-sm font-semibold text-white transition hover:bg-[#ff3347] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                  Generate Preview
                </button>
              </div>
            </Panel>
          </aside>

          <section className="space-y-6">
            <Panel
              title="Live Preview"
              description="Rendered output appears here after the backend processes the stored filename."
              icon={<FileImage className="h-4 w-4" />}
              action={
                <div className="flex flex-wrap items-end gap-3">
                  <LabeledSelect
                    label="PSD DPI"
                    value={String(psdDpi)}
                    options={DEFAULT_SCREEN_DPI_OPTIONS}
                    onChange={(value) => setPsdDpi(Number(value))}
                    className="w-[150px]"
                  />
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#A1A8B3]">
                    {resultPreviewUrl ? "Preview ready" : "No preview yet"}
                  </span>
                  {resultPreviewUrl && (
                    <a
                      href={resultPreviewUrl}
                      download={downloadFileName}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-[#E11D2E]/30 bg-[#E11D2E]/10 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffb4b9] transition hover:border-[#E11D2E]/50 hover:bg-[#E11D2E]/20 hover:text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PNG
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={downloadPsd}
                    disabled={!currentFileId || isRendering || isUploading || isDownloadingPsd || !hasAuth}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A1A8B3] transition hover:border-[#E11D2E]/40 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isDownloadingPsd ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Download PSD
                  </button>
                </div>
              }
            >
              <div className="relative min-h-[72vh] overflow-hidden rounded-3xl border border-white/10 bg-[#0E1012]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,29,46,0.12),transparent_55%)]" />
                {resultPreviewUrl ? (
                  <img
                    src={resultPreviewUrl}
                    alt="Bitmap preview output"
                    className="relative z-10 h-full w-full origin-center object-contain p-4"
                  />
                ) : sourcePreviewUrl ? (
                  <img
                    src={sourcePreviewUrl}
                    alt="Source image preview"
                    className="relative z-10 h-full w-full origin-center object-contain p-4 opacity-90"
                  />
                ) : (
                  <div className="relative z-10 flex h-full items-center justify-center text-center text-sm text-[#6B7280]">
                    <div className="space-y-2">
                      <Palette className="mx-auto h-10 w-10 text-[#E11D2E]" />
                      <p>Upload an asset and select a preset to generate the textile print simulation.</p>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <section className="grid gap-4 md:grid-cols-3">
              <InfoCard label="File" value={selectedFile ? selectedFile.name : "Awaiting upload"} />
              <InfoCard label="Preset" value={activePresetLabel} />
              <InfoCard label="Mode" value="Multi-Color" />
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#181B1F]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E11D2E]/20 bg-[#E11D2E]/10 text-[#E11D2E]">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#A1A8B3]">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  const displayValue = unit ? `${value}${unit}` : `${value}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">{label}</p>
        <p className="text-sm font-semibold text-white">{displayValue}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
        style={{
          background: `linear-gradient(to right, #E11D2E 0%, #E11D2E ${percent}%, rgba(255,255,255,0.1) ${percent}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className || ""}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-[#E11D2E]/40"
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-[#111315]">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
      </div>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B7280]">{label}</p>
      <p className="mt-2 break-words text-xs text-white">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
