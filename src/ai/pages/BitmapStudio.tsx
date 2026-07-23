import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  AlertCircle,
  BadgeCheck,
  ChevronDown,
  CloudUpload,
  Download,
  FileImage,
  ImageUp,
  Loader2,
  Palette,
  ScanLine,
  Sparkles,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { getToken } from "@/api/apiClient";
import AiCreditCost from "@/ai/components/AiCreditCost";
import {
  bitmapApi,
  getBitmapErrorMessage,
  type BitmapBinaryResponse,
  type BitmapUploadResponse,
} from "@/api/bitmapApi";
import { getMyCredits } from "@/api/subscriptionApi";

import gptImage2Showcase from "@/assets/gpt-image2-showcase.png";
import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";

const faqs = [
  {
    question: "What is RDC Bitmap Studio?",
    answer: "RDC Bitmap Studio is a specialized production tool that prepares digital artwork for textile screen printing. It translates gradient tones into bitmap dithers or halftone screens so each color plate can be exposed as clean, printable stencils.",
  },
  {
    question: "What are halftone shapes?",
    answer: "Halftone shapes define the geometry of screens: Circle is standard for smooth details; Square/Diamond offers bold artistic screen patterns; Line is ideal for textured vintage and high-density printing.",
  },
  {
    question: "What is the difference between Screen DPI and PSD DPI?",
    answer: "Screen DPI represents the target output screen frequency (e.g. 300, 520, or 600 DPI) for previewing and dithering calculations. PSD DPI is the resolution embedded in the final Photoshop file download to ensure print film outputs map correctly on stencils.",
  },
  {
    question: "How do manual spot color hex values work?",
    answer: "By entering comma-separated hex codes (e.g., #ff0000,#00ff00), you explicitly instruct the separation engine to map the artwork's color channels directly into those specific printing ink channels, matching your physical setup.",
  },
];


type Notice = {
  type: "info" | "success" | "error";
  text: string;
} | null;
type WorkflowMode = "single" | "multicolor";
type HalftoneShape = "circle" | "square" | "diamond" | "line";

const DEFAULT_MANUAL_SPOT_COLORS = "#f7d7dc,#e8a9b4,#c86f84,#8d4259";

const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"];
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff"];
const DEFAULT_SCREEN_DPI_OPTIONS = ["300", "520", "600"];

const shapeOptions: HalftoneShape[] = ["circle", "square", "diamond", "line"];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const spacingFromFrequency = (frequency: number) => clamp(32 - frequency * 0.3, 5, 30);

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
  return getBitmapErrorMessage(error);
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
  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const workflowMode: WorkflowMode = "multicolor";
  const [dotScreenEnabled, setDotScreenEnabled] = useState(true);
  const [grayscaleEnabled, setGrayscaleEnabled] = useState(true);
  const [spotColorCount, setSpotColorCount] = useState(6);
  const [manualSpotColors, setManualSpotColors] = useState(DEFAULT_MANUAL_SPOT_COLORS);
  const [intensity, setIntensity] = useState(50);
  const [frequency, setFrequency] = useState(40);
  const [angle, setAngle] = useState(45);
  const [dotSize, setDotSize] = useState(85);
  const [dpi, setDpi] = useState(300);
  const [screenDpiOptions, setScreenDpiOptions] = useState<string[]>(DEFAULT_SCREEN_DPI_OPTIONS);
  const [psdDpi, setPsdDpi] = useState(520);
  const [dotShape, setDotShape] = useState<HalftoneShape>("circle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [dpiDialogOpen, setDpiDialogOpen] = useState(false);
  const [pendingDpiFile, setPendingDpiFile] = useState<File | null>(null);
  const [pendingDpiInput, setPendingDpiInput] = useState(String(dpi));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const token = getToken();
  const hasAuth = Boolean(token);
  const currentFileId = uploadResponse?.filename || "";
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

  useEffect(() => {
    let active = true;

    const loadCredits = async () => {
      if (!hasAuth) {
        if (active) {
          setAvailableCredits(null);
        }
        return;
      }

      try {
        const credits = await getMyCredits();
        if (active && Number.isFinite(credits)) {
          setAvailableCredits(credits);
        }
      } catch {
        if (active) {
          setAvailableCredits(null);
        }
      }
    };

    void loadCredits();

    return () => {
      active = false;
    };
  }, [hasAuth]);

  useEffect(() => {
    if (!dpiDialogOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDpiDialog();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [dpiDialogOpen]);

  const setBanner = (text: string, type: NonNullable<Notice>["type"] = "info") => {
    setNotice({ text, type });
  };

  const syncAvailableCredits = (remainingCredits?: number | null) => {
    if (typeof remainingCredits === "number" && Number.isFinite(remainingCredits)) {
      setAvailableCredits(remainingCredits);
    }
  };

  const refreshCredits = async () => {
    try {
      const credits = await getMyCredits();
      if (Number.isFinite(credits)) {
        setAvailableCredits(credits);
      }
    } catch {
      // Ignore refresh failure.
    }
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

  const registerDpiOption = (value: number) => {
    setDpi(value);
    setScreenDpiOptions((currentOptions) => {
      const nextOption = String(value);
      if (currentOptions.includes(nextOption)) {
        return currentOptions;
      }

      return [...currentOptions, nextOption].sort((left, right) => Number(left) - Number(right));
    });
  };

  const openDpiDialog = (file: File) => {
    setPendingDpiFile(file);
    setPendingDpiInput(String(dpi));
    setDpiDialogOpen(true);
  };

  const closeDpiDialog = () => {
    setDpiDialogOpen(false);
    setPendingDpiFile(null);
    setPendingDpiInput(String(dpi));
  };

  const confirmDpiSelection = async () => {
    if (!pendingDpiFile) return;

    const parsedDpi = Number(pendingDpiInput);
    if (!Number.isFinite(parsedDpi) || parsedDpi <= 0) {
      setBanner("Please enter a valid image DPI before uploading.", "error");
      return;
    }

    const normalizedDpi = Math.round(parsedDpi);
    registerDpiOption(normalizedDpi);
    setBanner(`Image DPI set to ${normalizedDpi}.`, "info");
    closeDpiDialog();
    await syncLocalFile(pendingDpiFile);
  };

  const handleFileSelection = (file?: File) => {
    if (!file) return;

    const normalizedName = file.name.toLowerCase();
    const isAllowed =
      ALLOWED_IMAGE_TYPES.includes(file.type) ||
      ALLOWED_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));

    if (!isAllowed) {
      setBanner("Please upload a PNG, JPG, JPEG, WEBP, BMP, TIF, or TIFF image.", "error");
      return;
    }

    openDpiDialog(file);
  };

  const buildActiveRequest = () => {
    if (!currentFileId) {
      return null;
    }

    const selectedSpacing = Number(spacingFromFrequency(frequency).toFixed(2));
    const selectedDotSize = Number((selectedSpacing * (dotSize / 100)).toFixed(2));
    const proofOverrides = {
      algorithm: dotScreenEnabled ? "halftone" : "dither",
      dither_algo: "atkinson",
      shape: dotShape,
      spacing: selectedSpacing,
      dot_size: selectedDotSize,
      angle: Number(angle.toFixed(2)),
      dpi,
      workflow_mode: workflowMode,
      dot_screen_enabled: dotScreenEnabled,
      spot_color_count: spotColorCount,
      manual_spot_colors: manualSpotColors,
      warm_psd_cache: true,
    };

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

      let previewResponse: BitmapBinaryResponse;
      switch (request.endpoint) {
        case "separationProof":
          previewResponse = await bitmapApi.previewSeparationProof(request.params, token || undefined);
          break;
        default:
          previewResponse = await bitmapApi.previewDither(request.params, token || undefined);
      }

      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }

      syncAvailableCredits(previewResponse.remainingCredits);
      if (previewResponse.remainingCredits === null) {
        await refreshCredits();
      }

      const nextPreviewUrl = URL.createObjectURL(previewResponse.blob);
      resultUrlRef.current = nextPreviewUrl;
      setResultPreviewUrl(nextPreviewUrl);
      setBanner(
        typeof previewResponse.remainingCredits === "number"
          ? `Preview ready for review. ${previewResponse.remainingCredits} credits remaining.`
          : "Preview ready for review.",
        "success"
      );
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

      const exportResponse = await bitmapApi.exportPsd(
        { ...request.params, dpi: psdDpi, include_grayscale_layers: true },
        token || undefined
      );
      syncAvailableCredits(exportResponse.remainingCredits);
      if (exportResponse.remainingCredits === null) {
        await refreshCredits();
      }
      downloadBlob(exportResponse.blob, psdFileName);
      setBanner(
        typeof exportResponse.remainingCredits === "number"
          ? `${psdDpi} DPI PSD download started. ${exportResponse.remainingCredits} credits remaining.`
          : `${psdDpi} DPI PSD download started.`,
        "success"
      );
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-[#A1A8B3]">
                  Subscription access only. Bitmap processing consumes AI credits after successful output.
                </p>
                <AiCreditCost credits={10} label="Deduction" />
              </div>
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
            className={`relative max-w-4xl overflow-hidden rounded-[24px] border bg-[#181B1F]/90 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur ${
              notice.type === "success"
                ? "border-emerald-500/20"
                : notice.type === "error"
                  ? "border-[#E11D2E]/25"
                  : "border-white/10"
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-0.5 ${
                notice.type === "success"
                  ? "bg-emerald-400"
                  : notice.type === "error"
                    ? "bg-[#E11D2E]"
                    : "bg-white/20"
              }`}
            />
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                  notice.type === "success"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : notice.type === "error"
                      ? "border-[#E11D2E]/20 bg-[#E11D2E]/10 text-[#ffb4b9]"
                      : "border-white/10 bg-white/[0.04] text-[#D1D5DB]"
                }`}
              >
                {notice.type === "success" ? (
                  <BadgeCheck className="h-4 w-4" />
                ) : notice.type === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4 text-[#E11D2E]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8A909A]">
                    Bitmap status
                  </p>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                      notice.type === "success"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                        : notice.type === "error"
                          ? "border-[#E11D2E]/20 bg-[#E11D2E]/10 text-[#ffb4b9]"
                          : "border-white/10 bg-white/[0.04] text-[#A1A8B3]"
                    }`}
                  >
                    {notice.type}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-[#E7EAF0]">{notice.text}</p>
              </div>
            </div>
          </div>
        )}

        {!hasAuth && (
          <div className="rounded-[24px] border border-[#E11D2E]/20 bg-[#181B1F]/90 px-4 py-3 text-sm text-[#ffb4b9] shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur">
            <span className="inline-flex rounded-full border border-[#E11D2E]/20 bg-[#E11D2E]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ffb4b9]">
              Auth required
            </span>
            <span className="ml-3 align-middle">
              You can preview the local file, but backend upload and rendering require an authenticated session.
            </span>
          </div>
        )}

        <AnimatePresence>
          {dpiDialogOpen && pendingDpiFile && (
            <motion.div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#181B1F] shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
              >
                <div className="border-b border-white/5 bg-[#1C2025] px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E11D2E]/20 bg-[#E11D2E]/10 text-[#E11D2E]">
                      <FileImage className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8A909A]">
                        Bitmap import
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">How much DPI is this image?</h3>
                      <p className="mt-1 text-sm leading-6 text-[#A1A8B3]">
                        Enter the source image DPI before upload so Bitmap Studio can match the print workflow.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 px-6 py-5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8A909A]">
                      Selected file
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-white">{pendingDpiFile.name}</p>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[#8A909A]">
                      Image DPI
                    </span>
                    <input
                      autoFocus
                      type="number"
                      min="1"
                      step="1"
                      value={pendingDpiInput}
                      onChange={(event) => setPendingDpiInput(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#111315] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#4B5563] focus:border-[#E11D2E]/40"
                      placeholder="300"
                    />
                    <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
                      The value will be saved as the active bitmap DPI and added to the DPI list if it is new.
                    </p>
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/5 bg-[#111315] px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDpiDialog}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-[#A1A8B3] transition hover:border-white/20 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDpiSelection()}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#E11D2E] px-5 text-sm font-semibold text-white transition hover:bg-[#ff3347]"
                  >
                    Confirm DPI
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Design Workspace: Upload & Live Preview Side-by-Side in one box */}
        <div className="rounded-[28px] border border-[#2B3138] bg-[#181B1F]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between border-b border-[#2B3138]/40 pb-4 mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E11D2E]/20 bg-[#E11D2E]/10 text-[#E11D2E]">
                <FileImage className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Design Workspace & Simulation</h2>
                <p className="text-xs text-[#A1A8B3]">Upload design artwork and inspect the generated screen-printing halftone simulation side-by-side.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LabeledSelect
                label="PSD DPI"
                value={String(psdDpi)}
                options={DEFAULT_SCREEN_DPI_OPTIONS}
                onChange={(value) => setPsdDpi(Number(value))}
                className="w-[120px]"
              />
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-[#A1A8B3]">
                Credits: {availableCredits === null ? "--" : availableCredits}
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-[#A1A8B3]">
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Upload zone */}
            <div className="flex flex-col space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#A1A8B3]">
                1. Source Artwork
              </span>
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    void handleFileSelection(file);
                  }
                }}
                className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
                  isDragOver
                    ? "border-[#E11D2E] bg-[#E11D2E]/5"
                    : "border-[#2B3138] bg-[#111315]/30 hover:border-[#E11D2E]/40 hover:bg-[#111315]/50"
                } w-full aspect-square`}
              >
                {sourcePreviewUrl ? (
                  <div className="absolute inset-0 h-full w-full flex items-center justify-center overflow-hidden">
                    <img
                      src={sourcePreviewUrl}
                      alt="Source preview"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/50">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (sourceUrlRef.current) {
                            URL.revokeObjectURL(sourceUrlRef.current);
                            sourceUrlRef.current = null;
                          }
                          clearGeneratedPreview();
                          setSelectedFile(null);
                          setUploadResponse(null);
                          setSourcePreviewUrl(null);
                        }}
                        className="rounded-full bg-[#E11D2E] p-2.5 text-white hover:bg-[#ff3347] transition transform scale-90 group-hover:scale-100 duration-300 shadow-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CloudUpload className="h-5 w-5 text-[#A1A8B3] group-hover:text-[#E11D2E] transition-colors" />
                    <div className="text-center px-4">
                      <p className="text-xs font-bold text-[#A1A8B3] group-hover:text-white transition-colors">
                        Drag & drop image here or <span className="text-[#E11D2E]">browse</span>
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#6B7280]">Supports PNG, JPG, WEBP • Max 10MB</p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
                  accept=".png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,image/png,image/jpeg,image/webp,image/bmp,image/tiff"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    void handleFileSelection(file || undefined);
                    event.currentTarget.value = "";
                  }}
                />
              </div>

              {selectedFile && (
                <div className="rounded-2xl border border-white/10 bg-[#0E1012] p-4 mt-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Selected File</p>
                      <p className="mt-1 text-sm font-semibold text-white break-all">
                        {selectedFile.name}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#A1A8B3]">
                    <InfoRow label="Type" value={selectedFile.type || "Unknown"} />
                    <InfoRow label="Size" value={formatBytes(selectedFile.size)} />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live Preview Output */}
            <div className="flex flex-col space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#A1A8B3]">
                2. Live Print Simulation
              </span>
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#0E1012] flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,29,46,0.12),transparent_55%)]" />
                {resultPreviewUrl ? (
                  <img
                    src={resultPreviewUrl}
                    alt="Bitmap preview output"
                    className="relative z-10 h-full w-full origin-center object-contain p-4 mx-auto"
                  />
                ) : sourcePreviewUrl ? (
                  <img
                    src={sourcePreviewUrl}
                    alt="Source image preview"
                    className="relative z-10 h-full w-full origin-center object-contain p-4 opacity-90 mx-auto"
                  />
                ) : (
                  <div className="relative z-10 flex h-full items-center justify-center text-center text-sm text-[#6B7280]">
                    <div className="space-y-2 py-20">
                      <Palette className="mx-auto h-10 w-10 text-[#E11D2E]" />
                      <p>Upload an asset and review the default bitmap settings to generate the textile print simulation.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Default bitmap controls */}
        <div className="space-y-6 mb-6">
          <Panel
            title="1. Default Print Setup"
            description="Default bitmap controls tuned for consistent textile prep."
            icon={<SlidersHorizontal className="h-4 w-4" />}
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
                        <p className="text-xs text-[#A1A8B3]">Default bitmap workspace is active.</p>
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
          </div>
          </Panel>
        </div>

        {/* Selected file summary card info */}
        <section className="grid gap-4 md:grid-cols-3 mt-4">
          <InfoCard label="File" value={selectedFile ? selectedFile.name : "Awaiting upload"} />
          <InfoCard label="Setup" value="Default bitmap workspace" />
          <InfoCard label="Mode" value="Multi-Color" />
        </section>

        {/* Promotional Info / Description Sections */}
        <div className="mt-16 space-y-20 border-t border-[#2B3138]/40 pt-16 pb-8">
          {/* Section 1: Introducing GPT Image 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Introducing GPT Image 2
              </h2>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                OpenAI's GPT Image 2 marks a major step forward in AI-powered image generation, turning simple prompts into detailed, production-ready visuals with greater accuracy, control, and creative range. Built to handle complex instructions, it can render precise cases like marketing campaigns, social media content, storyboarding, and educational graphics.
              </p>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                With flexible aspect ratios and the ability to generate cohesive sets of visuals, it streamlines the path from concept to execution. Now available in Shutterstock's AI image generator, GPT Image 2 helps creators move from idea to high-quality visuals faster and more efficiently.
              </p>
            </div>
            <div className="relative group overflow-hidden rounded-[24px] border border-[#2B3138] bg-[#1C2025] p-2 transition-all duration-300 hover:border-[#E11D2E]/40 hover:shadow-2xl">
              <img
                src={gptImage2Showcase}
                alt="GPT Image 2 Showcase"
                className="w-full h-[300px] md:h-[340px] rounded-[18px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Section 2: More AI Images for Less */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative group overflow-hidden rounded-[24px] border border-[#2B3138] bg-[#1C2025] p-2 transition-all duration-300 hover:border-[#E11D2E]/40 hover:shadow-2xl order-2 md:order-1">
              <img
                src={flamingoShowcase}
                alt="Flamingo Showcase"
                className="w-full h-[300px] md:h-[340px] rounded-[18px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                More AI Images for Less
              </h2>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                Generate AI images at scale with our affordable <span className="text-white underline cursor-pointer hover:text-[#E11D2E] transition-colors">Generative AI Plus plan</span>. Get 100 generations a month, each producing four high-quality images, for up to 400 images total.
              </p>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                Want to test it out? Get started with two free image generations! Each AI-generation includes a high-res download, and full rights so you can use them commercially.
              </p>
            </div>
          </div>

          {/* Section 3: How the AI Image Generator Works */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                How the AI Image Generator Works
              </h2>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                Our AI image generator, powered by models like Google's Gemini 3.1 Flash, Imagen 4 Ultra, and GPT Image 2 from OpenAI, lets you create high-quality AI generated images from just a few words.
              </p>
              <p className="text-sm text-[#A1A8B3] leading-relaxed">
                Choose from a variety of <span className="text-white underline cursor-pointer hover:text-[#E11D2E] transition-colors">AI styles</span>—including Oil painting, Fish eye, or Motion blur—and select your preferred aspect ratio to match your creative vision.
              </p>
            </div>
            <div className="relative group overflow-hidden rounded-[24px] border border-[#2B3138] bg-[#1C2025] p-2 transition-all duration-300 hover:border-[#E11D2E]/40 hover:shadow-2xl">
              <img
                src={colorfulCharacterShowcase}
                alt="Colorful Character Showcase"
                className="w-full h-[300px] md:h-[340px] rounded-[18px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 border-t border-[#2B3138]/40 pt-10 pb-8 max-w-6xl mx-auto w-full px-4">
          <h2 className="text-2xl font-extrabold text-center text-white tracking-tight mb-8">
            AI Bitmap Studio: FAQs
          </h2>
          <div className="space-y-0">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="border-b border-[#2B3138]/30 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between py-3 text-left group"
                  >
                    <span className="text-sm md:text-base font-bold text-[#F5F7FA] group-hover:text-[#E11D2E] transition-colors leading-relaxed pr-6">
                      {faq.question}
                    </span>
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-[#2B3138]/60 group-hover:border-[#E11D2E]/40 text-[#A1A8B3] group-hover:text-[#E11D2E] transition-all duration-300">
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 text-sm leading-relaxed text-[#A1A8B3] pt-1">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

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
