import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  Expand,
  FileImage,
  Grid3X3,
  ImageUp,
  Loader2,
  RefreshCcw,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import gptImage2Showcase from "@/assets/gpt-image2-showcase.png";
import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";
import AiCreditCost from "@/ai/components/AiCreditCost";
import { generateSeamlessPattern, normalizeAiOutputUrl } from "@/api/aiApi";

const SEAMLESS_PATTERN_CREDIT_COST = 7;

type Mode = "auto" | "manual";

type Notice = {
  type: "success" | "warning" | "error" | "info";
  text: string;
} | null;

type ValidationPayload = {
  ai_inpaint_used?: boolean;
  vertex_fallback_used?: boolean;
  vertex_status?: string;
  method?: string;
  quality_rating?: string;
  repeat_ready?: boolean;
  needs_ai_inpaint?: boolean;
  strict_validation_status?: string;
};

type SeamlessResponse = {
  success?: boolean;
  message?: string;
  warning?: string;
  detail?: string | { message?: string };
  output_image?: string;
  tile_url?: string;
  preview_url?: string;
  validation?: ValidationPayload;
};

const STEPS = [
  "Reading artwork",
  "Finding seam bands",
  "Building tile",
  "Validating repeat",
  "Rendering preview",
];

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolveSeamlessBaseUrl = () => {
  const envBase = trimTrailingSlash(import.meta.env.VITE_SEAMLESS_SERVICE_URL || "");
  if (envBase) return envBase;
  if (import.meta.env.DEV) {
    const host = window.location.hostname || "127.0.0.1";
    return `http://${host}:8002`;
  }
  return "https://ruchitadesigncompany.in";
};

const normalizeAssetUrl = (url: string) => {
  if (/^https?:\/\//i.test(url) || url.startsWith("blob:") || url.startsWith("data:")) {
    return normalizeAiOutputUrl(url);
  }
  return `${resolveSeamlessBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
};

const cacheBust = (url: string) => `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const getErrorMessage = (payload: SeamlessResponse | null) => {
  if (payload?.message) return payload.message;
  if (typeof payload?.detail === "string") return payload.detail;
  if (payload?.detail && typeof payload.detail === "object" && payload.detail.message) {
    return payload.detail.message;
  }
  return "Generation failed. Check backend logs.";
};

const validationBadges = (validation?: ValidationPayload) => {
  if (!validation) return [];

  const badges: Array<{ label: string; tone: "success" | "warning" | "neutral" }> = [];

  if (validation.ai_inpaint_used) {
    badges.push({ label: "Vertex AI Used", tone: "success" });
  } else if (validation.vertex_fallback_used || (validation.vertex_status && validation.vertex_status !== "used")) {
    badges.push({ label: "Vertex AI Failed", tone: "warning" });
  }

  if (validation.method) badges.push({ label: `Method: ${validation.method.replace(/_/g, " ")}`, tone: "neutral" });

  if (validation.quality_rating) {
    badges.push({
      label: `Quality: ${validation.quality_rating}`,
      tone: validation.quality_rating === "good" ? "success" : validation.quality_rating === "fair" ? "warning" : "neutral",
    });
  }

  if (validation.repeat_ready !== undefined) {
    badges.push({ label: validation.repeat_ready ? "Repeat Ready" : "Not Repeat-Ready", tone: validation.repeat_ready ? "success" : "warning" });
  }

  if (validation.needs_ai_inpaint) badges.push({ label: "AI Inpaint Recommended", tone: "warning" });
  if (validation.strict_validation_status) badges.push({ label: validation.strict_validation_status.replace(/_/g, " "), tone: "neutral" });

  return badges;
};

const seamlessFaqs = [
  {
    question: "What does the Seamless AI Studio do?",
    answer: "RDC Seamless AI Studio analyzes the edges of your image and applies intelligent blending to eliminate visible seams, creating a tileable pattern that repeats infinitely without lines.",
  },
  {
    question: "How does the 3x3 repeat preview help?",
    answer: "The 3x3 grid tiles the seamless output 9 times side-by-side to visually confirm that the edges align perfectly and that no repeating artifacts or harsh seam lines are visible.",
  },
  {
    question: "What are the Auto and Manual modes?",
    answer: "Auto mode runs edge analysis and blends seams automatically. Manual mode lets you customize the blending band width and tweak seam parameters.",
  },
  {
    question: "What file formats are supported?",
    answer: "You can upload PNG, JPG, and WEBP files. The output seamless tile is generated as a high-resolution PNG, ready for Photoshop pattern imports.",
  },
];

export default function SeamlessStudio() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>("auto");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [horizontalBand, setHorizontalBand] = useState(48);
  const [verticalBand, setVerticalBand] = useState(48);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [tileUrl, setTileUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [validation, setValidation] = useState<ValidationPayload | undefined>();
  const [notice, setNotice] = useState<Notice>(null);
  const [lightbox, setLightbox] = useState<{ src: string; label: string; checker?: boolean } | null>(null);

  const endpointLabel = useMemo(() => "Java AI gateway", []);
  const badges = validationBadges(validation);

  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = sourceImage.naturalWidth || sourceImage.width;
    const height = sourceImage.naturalHeight || sourceImage.height;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(sourceImage, width / 2, height / 2, width / 2, height / 2, 0, 0, width / 2, height / 2);
    ctx.drawImage(sourceImage, 0, height / 2, width / 2, height / 2, width / 2, 0, width / 2, height / 2);
    ctx.drawImage(sourceImage, width / 2, 0, width / 2, height / 2, 0, height / 2, width / 2, height / 2);
    ctx.drawImage(sourceImage, 0, 0, width / 2, height / 2, width / 2, height / 2, width / 2, height / 2);

    ctx.fillStyle = "rgba(225, 29, 46, 0.38)";
    ctx.fillRect(width / 2 - verticalBand, 0, verticalBand * 2, height);
    ctx.fillRect(0, height / 2 - horizontalBand, width, horizontalBand * 2);
  }, [horizontalBand, sourceImage, verticalBand]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const clearResults = () => {
    setTileUrl("");
    setPreviewUrl("");
    setValidation(undefined);
  };

  const loadFile = (file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setNotice({ type: "error", text: "Unsupported file type. Use PNG, JPG, or WEBP." });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setNotice({ type: "error", text: "File exceeds the 20MB limit." });
      return;
    }

    if (sourceUrl.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);

    const nextUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setSourceImage(image);
    image.src = nextUrl;

    setSelectedFile(file);
    setSourceUrl(nextUrl);
    setNotice({ type: "success", text: `${file.name} loaded.` });
    clearResults();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const resetWorkspace = () => {
    if (sourceUrl.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
    setSelectedFile(null);
    setSourceUrl("");
    setSourceImage(null);
    setMode("auto");
    setHorizontalBand(48);
    setVerticalBand(48);
    setProgress(0);
    setStepIndex(0);
    setNotice({ type: "success", text: "Workspace cleared." });
    clearResults();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateSeamless = async () => {
    if (!selectedFile) {
      setNotice({ type: "error", text: "Upload a textile image first." });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStepIndex(0);
    setNotice(null);
    clearResults();

    let localProgress = 0;
    let localStep = 0;
    const targets = [18, 38, 58, 78, 92];

    const interval = window.setInterval(() => {
      const target = targets[localStep] || 92;
      if (localProgress < target) {
        localProgress = Math.min(target, localProgress + Math.random() * 5 + 2);
        setProgress(localProgress);
      } else if (localStep < STEPS.length - 1) {
        localStep += 1;
        setStepIndex(localStep);
      }
    }, 220);

    try {
      const payload = (await generateSeamlessPattern(selectedFile, {
        mode,
        horizontalBand,
        verticalBand,
      })) as SeamlessResponse;
      const tile = payload.tile_url || payload.output_image || "";
      const hasTile = Boolean(tile);

      if (!payload?.success && !hasTile) {
        throw new Error(getErrorMessage(payload));
      }

      setProgress(100);
      setStepIndex(STEPS.length - 1);
      setValidation(payload?.validation);

      if (tile) setTileUrl(cacheBust(normalizeAssetUrl(tile)));
      if (payload?.preview_url) setPreviewUrl(cacheBust(normalizeAssetUrl(payload.preview_url)));

      if (payload?.warning || payload?.message) {
        setNotice({
          type: payload.warning ? "warning" : "success",
          text: payload.message || "Strict validation warning: output may have visible seams.",
        });
      } else {
        setNotice({ type: "success", text: "Seamless tile generated." });
      }
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Network error. Check your seamless backend.",
      });
    } finally {
      window.clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setNotice({ type: "warning", text: "Opened image in a new tab. Save it from there if direct download is blocked." });
    }
  };

  return (
    <div className="min-h-full bg-[#111315] text-white">
      <div className="border-b border-[#2B3138] bg-[#181B1F]/70 px-5 py-4">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E11D2E]/25 bg-[#E11D2E]/10 text-[#ff4d5d]">
                <Grid3X3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-normal text-white">Seamless Pattern Studio</h1>
                <p className="text-sm text-[#A1A8B3]">Generate repeat-ready textile tiles from uploaded artwork.</p>
                <div className="mt-3">
                  <AiCreditCost credits={SEAMLESS_PATTERN_CREDIT_COST} label="Pattern Generation" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#2B3138] bg-[#1C2025] px-3 py-2 text-xs font-semibold text-[#A1A8B3]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
            API: {endpointLabel}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-4 p-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-4">
          <section className="rounded-lg border border-[#2B3138] bg-[#181B1F] p-4">
            <p className="text-xs font-bold uppercase text-[#E11D2E]">1. Source Image</p>
            <h2 className="mt-1 text-base font-semibold text-white">Upload textile artwork</h2>

            <div
              onDrop={handleDrop}
              onDragOver={(event) => event.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed transition ${
                sourceUrl ? "border-[#2B3138] bg-[#111315]" : "border-[#2B3138] bg-[#1C2025] hover:border-[#E11D2E]/45 hover:bg-[#20242A]"
              }`}
            >
              {sourceUrl ? (
                <img src={sourceUrl} alt="Original artwork" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#2B3138] bg-[#111315] text-[#A1A8B3]">
                    <ImageUp className="h-7 w-7" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">Click or drag image</span>
                    <span className="mt-1 block text-xs text-[#6B7280]">PNG, JPG, WEBP up to 20MB</span>
                  </span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) loadFile(file);
              }}
            />

            {selectedFile && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#2B3138] bg-[#111315] p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E11D2E]/10 text-[#ff4d5d]">
                  <FileImage className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{selectedFile.name}</span>
                  <span className="text-xs text-[#6B7280]">
                    {formatBytes(selectedFile.size)} / {selectedFile.type.split("/")[1]?.toUpperCase()}
                  </span>
                </span>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[#2B3138] bg-[#181B1F] p-4">
            <p className="text-xs font-bold uppercase text-[#E11D2E]">2. Seam Mode</p>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-[#2B3138] bg-[#111315] p-1">
              {(["auto", "manual"] as Mode[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={`rounded-md px-3 py-2 text-xs font-bold uppercase transition ${
                    mode === item ? "bg-[#E11D2E] text-white" : "text-[#A1A8B3] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {mode === "manual" && (
              <div className="mt-4 space-y-4 rounded-lg border border-[#2B3138] bg-[#111315] p-3">
                <div className="aspect-square overflow-hidden rounded-md border border-[#2B3138] bg-[#0F1113]">
                  <canvas ref={canvasRef} className="h-full w-full object-contain" />
                </div>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-xs font-semibold text-[#A1A8B3]">
                    Horizontal band <span className="text-[#ff8a96]">{horizontalBand * 2}px</span>
                  </span>
                  <input
                    type="range"
                    min={8}
                    max={160}
                    value={horizontalBand}
                    onChange={(event) => setHorizontalBand(Number(event.target.value))}
                    className="w-full accent-[#E11D2E]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-xs font-semibold text-[#A1A8B3]">
                    Vertical band <span className="text-[#ff8a96]">{verticalBand * 2}px</span>
                  </span>
                  <input
                    type="range"
                    min={8}
                    max={160}
                    value={verticalBand}
                    onChange={(event) => setVerticalBand(Number(event.target.value))}
                    className="w-full accent-[#E11D2E]"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <button
                onClick={() => void generateSeamless()}
                disabled={!selectedFile || isGenerating}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#E11D2E] text-sm font-bold text-white transition hover:bg-[#c91526] disabled:cursor-not-allowed disabled:bg-[#2B3138] disabled:text-[#6B7280]"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generate Seamless
              </button>
              <button
                onClick={resetWorkspace}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#2B3138] bg-[#111315] text-sm font-semibold text-[#A1A8B3] transition hover:text-white"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </section>
        </aside>

        <main className="space-y-4">
          <section className="rounded-lg border border-[#2B3138] bg-[#181B1F] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-[#E11D2E]">Processing</p>
                <h2 className="mt-1 text-base font-semibold text-white">{isGenerating ? STEPS[stepIndex] : "Seamless tile output"}</h2>
              </div>
              <div className="flex min-w-[220px] items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#2B3138]">
                  <div className="h-full rounded-full bg-[#E11D2E] transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-bold text-[#A1A8B3]">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`h-1 rounded-full transition ${
                    index < stepIndex || progress === 100 ? "bg-[#E11D2E]" : index === stepIndex && isGenerating ? "bg-[#ff8a96]" : "bg-[#2B3138]"
                  }`}
                />
              ))}
            </div>
          </section>

          {notice && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                notice.type === "error"
                  ? "border-[#E11D2E]/30 bg-[#E11D2E]/10 text-[#ffb3b3]"
                  : notice.type === "warning"
                    ? "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#ffd4ba]"
                    : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {notice.text}
            </div>
          )}

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    badge.tone === "success"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                      : badge.tone === "warning"
                        ? "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#ffd4ba]"
                        : "border-[#2B3138] bg-[#1C2025] text-[#A1A8B3]"
                  }`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          {!selectedFile && !tileUrl ? (
            <section className="flex min-h-[560px] flex-col items-center justify-center rounded-lg border border-[#2B3138] bg-[#181B1F] p-8 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-[#2B3138] bg-[#111315] text-[#E11D2E]">
                <Sparkles className="h-9 w-9" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-white">Upload a textile image to begin</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#A1A8B3]">
                Auto mode builds a repeat-ready tile directly. Manual mode lets you preview the offset seam mask before generation.
              </p>
            </section>
          ) : (
            <section className="grid gap-4 lg:grid-cols-2">
              <ResultPanel
                title="Generated Seamless Tile"
                url={tileUrl}
                checker
                loading={isGenerating && !tileUrl}
                onExpand={() => tileUrl && setLightbox({ src: tileUrl, label: "Generated Seamless Tile", checker: true })}
                onDownload={() => tileUrl && void downloadImage(tileUrl, "seamless_tile.png")}
              />
              <ResultPanel
                title="3 x 3 Repeat Preview"
                url={previewUrl}
                loading={isGenerating && !previewUrl}
                onExpand={() => previewUrl && setLightbox({ src: previewUrl, label: "3 x 3 Repeat Preview" })}
                onDownload={() => previewUrl && void downloadImage(previewUrl, "repeat_preview.png")}
              />
            </section>
          )}
        </main>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <button className="absolute inset-0 cursor-default" aria-label="Close preview" onClick={() => setLightbox(null)} />
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg border border-[#2B3138] bg-[#181B1F] shadow-2xl">
            <button
              onClick={() => setLightbox(null)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#2B3138] bg-[#111315] text-[#A1A8B3] transition hover:text-white"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
            <div className={lightbox.checker ? "bg-[linear-gradient(45deg,#20242A_25%,transparent_25%),linear-gradient(-45deg,#20242A_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#20242A_75%),linear-gradient(-45deg,transparent_75%,#20242A_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]" : ""}>
              <img src={lightbox.src} alt={lightbox.label} className="max-h-[82vh] max-w-[90vw] object-contain" />
            </div>
            <div className="border-t border-[#2B3138] px-4 py-3 text-sm font-semibold text-white">{lightbox.label}</div>
          </div>
        </div>
      )}

      {/* Promotional Info / Description Sections */}
      <div className="mt-16 space-y-20 border-t border-[#2B3138]/40 pt-16 pb-8">
        {/* Section 1: Seamless Textile Repeats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Seamless Textile Repeats
            </h2>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Create production-ready repeating patterns effortlessly. Our smart seamless algorithm analyzes color grids and textures at your design's outer borders, automatically applying soft blending and channel masking to dissolve harsh visual boundaries.
            </p>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Eliminate hard grid-line seams on fabric rolls. The resulting tileable image matches seamlessly on all sides, preparing your artwork for industrial rotary, flatbed, or digital textile printing.
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

        {/* Section 2: Infinite Pattern Previews */}
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
              Infinite Pattern Previews
            </h2>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Inspect your pattern at scale. Alongside the high-fidelity tile generator, the interface renders a 3x3 tiled grid repeat preview in real time. This lets you immediately check that colors align beautifully and that no repeating stripe artifacts degrade the visual layout.
            </p>
          </div>
        </div>

        {/* Section 3: Seamless Workflow Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Seamless Workflow Modes
            </h2>
            <p className="text-sm text-[#A1A8B3] leading-relaxed">
              Switch between modes. Use **Auto mode** for instant, algorithm-guided seam blending, or switch to **Manual mode** to fine-tune the horizontal and vertical seam band percentages. This allows perfect customization for complex textures and geometric handcrafts.
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
          AI Seamless Studio: FAQs
        </h2>
        <div className="space-y-0">
          {seamlessFaqs.map((faq, index) => {
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
  );
}

function ResultPanel({
  title,
  url,
  loading,
  checker,
  onExpand,
  onDownload,
}: {
  title: string;
  url: string;
  loading: boolean;
  checker?: boolean;
  onExpand: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#2B3138] bg-[#181B1F]">
      <div className="flex items-center justify-between gap-3 border-b border-[#2B3138] p-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onExpand}
            disabled={!url}
            className="flex h-8 items-center gap-1.5 rounded-md border border-[#2B3138] bg-[#111315] px-2.5 text-xs font-semibold text-[#A1A8B3] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#4B5563]"
          >
            <Expand className="h-3.5 w-3.5" />
            Expand
          </button>
          <button
            onClick={onDownload}
            disabled={!url}
            className="flex h-8 items-center gap-1.5 rounded-md border border-[#2B3138] bg-[#111315] px-2.5 text-xs font-semibold text-[#A1A8B3] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#4B5563]"
          >
            <Download className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>
      <div
        className={`relative flex min-h-[480px] items-center justify-center bg-[#0F1113] p-4 ${
          checker && url
            ? "bg-[linear-gradient(45deg,#181B1F_25%,transparent_25%),linear-gradient(-45deg,#181B1F_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#181B1F_75%),linear-gradient(-45deg,transparent_75%,#181B1F_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]"
            : ""
        }`}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111315]/70 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#E11D2E]" />
          </div>
        )}
        {url ? (
          <img src={url} alt={title} className="max-h-[440px] max-w-full rounded-md object-contain shadow-2xl" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-[#6B7280]">
            <Grid3X3 className="h-10 w-10" />
            <p className="text-sm">Preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
