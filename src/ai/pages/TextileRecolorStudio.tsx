import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  Image as ImageIcon,
  Layers,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Server,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";

type RecolorChange = {
  source_color_hex: string | null;
  target_color_hex: string;
  strength: number;
  saturation: number;
  brightness: number;
  tolerance: number;
  mask_blur: number;
  preserve_lightness: boolean;
  recolor_scope: "selected_area" | "whole_design";
  area_coverage: number;
};

type StatusState = {
  message: string;
  type: "info" | "success" | "error";
} | null;

type Rgb = { r: number; g: number; b: number };

const API_PORT = 8000;

const defaultDraft: RecolorChange = {
  source_color_hex: null,
  target_color_hex: "#ff3131",
  strength: 0.7,
  saturation: 1,
  brightness: 1,
  tolerance: 40,
  mask_blur: 5,
  preserve_lightness: true,
  recolor_scope: "selected_area",
  area_coverage: 50,
};

let cachedApiBase: string | null = null;

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const hexToRgb = (hex: string): Rgb => {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => clamp(v, 0, 255).toString(16).padStart(2, "0")).join("");

const getEffectiveTolerance = (baseTolerance: number, coverage: number) =>
  Math.max(1, baseTolerance * (0.4 + (coverage / 100) * 2));

function getApiCandidates() {
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const queryApiBase = new URLSearchParams(window.location.search).get("api_base");
  const storedApiBase = localStorage.getItem("textile_api_base");
  const inferredHostBase = window.location.hostname
    ? `${protocol}//${window.location.hostname}:${API_PORT}`
    : null;

  return [
    queryApiBase,
    storedApiBase,
    inferredHostBase,
    `${protocol}//127.0.0.1:${API_PORT}`,
    `${protocol}//localhost:${API_PORT}`,
  ].filter(Boolean) as string[];
}

async function isApiReachable(baseUrl: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`${baseUrl}/`, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function ensureApiBaseUrl() {
  if (cachedApiBase) return cachedApiBase;

  for (const candidate of [...new Set(getApiCandidates())]) {
    if (await isApiReachable(candidate)) {
      cachedApiBase = candidate;
      localStorage.setItem("textile_api_base", candidate);
      return candidate;
    }
  }

  throw new Error("Backend API not reachable on port 8000. Start FastAPI and confirm the API host/IP is correct.");
}

function buildFullMaskArray(width: number, height: number) {
  return new Float32Array(width * height).fill(1);
}

function buildSourceMaskArray(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sourceRgb: Rgb,
  toleranceValue: number,
  blurValue: number
) {
  const mask = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dr = data[idx] - sourceRgb.r;
      const dg = data[idx + 1] - sourceRgb.g;
      const db = data[idx + 2] - sourceRgb.b;
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);
      mask[y * width + x] = clamp(1 - distance / Math.max(1, toleranceValue), 0, 1);
    }
  }

  const blurPasses = Math.max(0, Math.floor(blurValue / 4));
  for (let pass = 0; pass < blurPasses; pass++) {
    const temp = new Float32Array(mask.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += mask[ny * width + nx];
              count++;
            }
          }
        }

        temp[y * width + x] = sum / count;
      }
    }

    mask.set(temp);
  }

  return mask;
}

function applySingleChangeToImageData(imageData: ImageData, width: number, height: number, change: RecolorChange) {
  const data = imageData.data;
  const target = hexToRgb(change.target_color_hex);
  let mask: Float32Array | null = null;

  if (change.recolor_scope === "whole_design") {
    mask = buildFullMaskArray(width, height);
  } else if (change.source_color_hex) {
    mask = buildSourceMaskArray(
      data,
      width,
      height,
      hexToRgb(change.source_color_hex),
      getEffectiveTolerance(change.tolerance, change.area_coverage),
      change.mask_blur
    );
  }

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    let r = data[idx];
    let g = data[idx + 1];
    let b = data[idx + 2];
    let effectiveMask = 1;

    if (mask) {
      effectiveMask = mask[i];
    } else {
      const gray = (r + g + b) / 3;
      const chroma = Math.sqrt((r - gray) ** 2 + (g - gray) ** 2 + (b - gray) ** 2) / 255;
      effectiveMask = clamp(chroma * (getEffectiveTolerance(change.tolerance, change.area_coverage) / 40), 0, 1);
    }

    const effect = change.strength * effectiveMask;
    r = r * (1 - effect) + target.r * effect;
    g = g * (1 - effect) + target.g * effect;
    b = b * (1 - effect) + target.b * effect;

    if (change.preserve_lightness) {
      const oldLight = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const newLight = Math.max(1, (r + g + b) / 3);
      const lightRatio = oldLight / newLight;
      r *= lightRatio;
      g *= lightRatio;
      b *= lightRatio;
    }

    const newGray = (r + g + b) / 3;
    r = (newGray + (r - newGray) * change.saturation) * change.brightness;
    g = (newGray + (g - newGray) * change.saturation) * change.brightness;
    b = (newGray + (b - newGray) * change.saturation) * change.brightness;

    data[idx] = clamp(Math.round(r), 0, 255);
    data[idx + 1] = clamp(Math.round(g), 0, 255);
    data[idx + 2] = clamp(Math.round(b), 0, 255);
  }
}

export default function TextileRecolorStudio() {
  const [draft, setDraft] = useState<RecolorChange>(defaultDraft);
  const [appliedChanges, setAppliedChanges] = useState<RecolorChange[]>([]);
  const [status, setStatus] = useState<StatusState>(null);
  const [sessionId, setSessionId] = useState<string | number | null>(null);
  const [originalImageElement, setOriginalImageElement] = useState<HTMLImageElement | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [backendResultUrl, setBackendResultUrl] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<"canvas" | "backend">("canvas");
  const [previewMode, setPreviewMode] = useState<"recolor" | "mask">("recolor");
  const [sourceColor, setSourceColor] = useState("#ff0000");
  const [useSourceColor, setUseSourceColor] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const localObjectUrlRef = useRef<string | null>(null);

  const effectiveDraft: RecolorChange = {
    ...draft,
    source_color_hex: useSourceColor ? sourceColor : null,
  };

  useEffect(() => {
    return () => {
      if (localObjectUrlRef.current) URL.revokeObjectURL(localObjectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!originalImageElement) return;
    if (previewMode === "mask") {
      renderMaskPreview();
    } else {
      renderStackPreviewLocal();
    }
    setActivePreview("canvas");
  }, [originalImageElement, appliedChanges, draft, sourceColor, useSourceColor, previewMode]);

  const setUiStatus = (message: string, type: "info" | "success" | "error" = "info") => {
    setStatus({ message, type });
  };

  const updateDraft = <T extends keyof RecolorChange>(key: T, value: RecolorChange[T]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const loadFile = async (file: File) => {
    const input = fileInputRef.current;
    if (input) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
    }
    await handleSelectedFile(file);
  };

  function setupCanvas() {
    if (!originalImageElement || !previewCanvasRef.current) return null;

    const canvas = previewCanvasRef.current;
    const parent = canvas.parentElement;
    const parentWidth = parent?.clientWidth || 900;
    const parentHeight = parent?.clientHeight || 520;
    const fitScale = Math.min(
      parentWidth / Math.max(1, originalImageElement.naturalWidth),
      parentHeight / Math.max(1, originalImageElement.naturalHeight)
    );
    const width = Math.max(1, Math.floor(originalImageElement.naturalWidth * fitScale));
    const height = Math.max(1, Math.floor(originalImageElement.naturalHeight * fitScale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(originalImageElement, 0, 0, width, height);
    return { canvas, ctx, width, height };
  }

  function renderStackPreviewLocal() {
    const setup = setupCanvas();
    if (!setup) return;

    const { ctx, width, height } = setup;
    const imageData = ctx.getImageData(0, 0, width, height);

    for (const change of appliedChanges) {
      applySingleChangeToImageData(imageData, width, height, change);
    }

    applySingleChangeToImageData(imageData, width, height, effectiveDraft);
    ctx.putImageData(imageData, 0, 0);
  }

  function renderMaskPreview() {
    const setup = setupCanvas();
    if (!setup) return;

    const { ctx, width, height } = setup;
    const imageData = ctx.getImageData(0, 0, width, height);
    const change = effectiveDraft;
    let mask: Float32Array | null = null;

    if (change.recolor_scope === "whole_design") {
      mask = buildFullMaskArray(width, height);
    } else if (change.source_color_hex) {
      mask = buildSourceMaskArray(
        imageData.data,
        width,
        height,
        hexToRgb(change.source_color_hex),
        getEffectiveTolerance(change.tolerance, change.area_coverage),
        change.mask_blur
      );
    } else {
      setUiStatus("Selected Area mode me source color pick karo.", "info");
      return;
    }

    const data = imageData.data;
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const m = mask[i];
      if (m > 0.01) {
        data[idx] = Math.round(data[idx] * (1 - m) + 255 * m);
        data[idx + 1] = Math.round(data[idx + 1] * (1 - m) + 255 * m);
        data[idx + 2] = Math.round(data[idx + 2] * (1 - m) + 255 * m);
      } else {
        data[idx] = Math.round(data[idx] * 0.25);
        data[idx + 1] = Math.round(data[idx + 1] * 0.25);
        data[idx + 2] = Math.round(data[idx + 2] * 0.25);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  async function prepareLocalPreview(file: File) {
    if (localObjectUrlRef.current) URL.revokeObjectURL(localObjectUrlRef.current);

    const url = URL.createObjectURL(file);
    localObjectUrlRef.current = url;
    setLocalPreviewUrl(url);
    setBackendResultUrl(null);
    setActivePreview("canvas");
    setPreviewMode("recolor");

    const img = new Image();
    img.onload = () => setOriginalImageElement(img);
    img.src = url;
  }

  async function handleSelectedFile(file: File) {
    await prepareLocalPreview(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setUiStatus("Uploading image...", "info");
      const apiBase = await ensureApiBaseUrl();
      const response = await fetch(`${apiBase}/colorway/upload`, { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || "Upload failed");

      setSessionId(data.session_id);
      setOriginalUrl(apiBase + data.original_image_url);
      setUiStatus("Image uploaded. Ab pehla color change banao aur Apply Change dabao.", "success");
    } catch (error) {
      setSessionId(null);
      setOriginalUrl(null);
      setUiStatus(error instanceof Error ? error.message : "Upload error", "error");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleSelectedFile(file);
  }

  function pickSourceColorFromCanvas(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = previewCanvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx || !originalImageElement || activePreview !== "canvas") return;

    if (draft.recolor_scope === "whole_design") {
      setUiStatus("Whole Design mode me source color ki zarurat nahi hoti.", "info");
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height));
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    setSourceColor(hex);
    setUseSourceColor(true);
    setPreviewMode("mask");
    setUiStatus(`Source color selected: ${hex}. Ab change set karke Apply Change dabao.`, "success");
  }

  function applyCurrentLayer() {
    if (!originalImageElement) {
      setUiStatus("Please upload image first.", "error");
      return;
    }

    setAppliedChanges((changes) => [...changes, effectiveDraft]);
    setPreviewMode("recolor");
    setUiStatus("Recolor layer applied to stack.", "success");
  }

  function getStackPayload(includeDraft = true) {
    const changes = [...appliedChanges];
    if (includeDraft) changes.push(effectiveDraft);
    return { session_id: sessionId, changes };
  }

  async function renderBackendPreview() {
    if (!sessionId) {
      setUiStatus("Please upload image first and confirm backend upload succeeds.", "error");
      return;
    }

    try {
      setIsRendering(true);
      setUiStatus("Rendering backend stack preview...", "info");
      const apiBase = await ensureApiBaseUrl();
      const response = await fetch(`${apiBase}/colorway/preview-stack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getStackPayload(true)),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail));
      }

      setBackendResultUrl(apiBase + data.preview_url);
      setActivePreview("backend");
      setUiStatus("Backend stack preview rendered successfully.", "success");
    } catch (error) {
      setUiStatus(error instanceof Error ? error.message : "Backend preview error", "error");
    } finally {
      setIsRendering(false);
    }
  }

  async function saveFinalImage() {
    if (!sessionId) {
      setUiStatus("Please upload image first and confirm backend upload succeeds.", "error");
      return;
    }

    try {
      setIsSaving(true);
      setUiStatus("Saving final stacked image...", "info");
      const apiBase = await ensureApiBaseUrl();
      const response = await fetch(`${apiBase}/colorway/save-stack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getStackPayload(true)),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail));
      }

      setBackendResultUrl(apiBase + data.final_image_url);
      setActivePreview("backend");
      setUiStatus("Final stacked image saved successfully.", "success");
    } catch (error) {
      setUiStatus(error instanceof Error ? error.message : "Save error", "error");
    } finally {
      setIsSaving(false);
    }
  }

  function resetAll() {
    setDraft(defaultDraft);
    setAppliedChanges([]);
    setStatus(null);
    setSourceColor("#ff0000");
    setUseSourceColor(false);
    setPreviewMode("recolor");
    setActivePreview("canvas");
    setBackendResultUrl(null);
  }

  const sliderControls = [
    { label: "Recolor Strength", key: "strength" as const, min: 0, max: 1, step: 0.05 },
    { label: "Fabric Saturation", key: "saturation" as const, min: 0.1, max: 3, step: 0.1 },
    { label: "Brightness", key: "brightness" as const, min: 0.1, max: 3, step: 0.1 },
    { label: "Area Tolerance", key: "tolerance" as const, min: 1, max: 150, step: 1 },
    { label: "Area Coverage", key: "area_coverage" as const, min: 0, max: 100, step: 1 },
    { label: "Mask Blur", key: "mask_blur" as const, min: 0, max: 25, step: 1 },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 lg:p-10 font-sans selection:bg-[#ff1a1a]/30">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-full -translate-x-1/2 bg-[#ff1a1a]/5 blur-[120px]" />

      <div className="relative z-10 max-w-[1500px] mx-auto">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col gap-6 border-b border-white/5 pb-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff1a1a]">
              <Sparkles className="h-3 w-3" /> Colorway Engine v1.0
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white md:text-6xl">
              Recolor <span className="text-gray-600 font-light">Studio</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-500">
              Build textile colorways with local stack previews, source-color masking, backend rendering, and layered exports.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-right">
            <Metric label="Session" value={sessionId ? "Live" : "Draft"} />
            <Metric label="Layers" value={appliedChanges.length} />
            <Metric label="Preview" value={activePreview === "backend" ? "Backend" : "Local"} />
          </div>
        </motion.header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 text-[#ff1a1a]">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              Draft Parameters
            </h2>

            <div className="space-y-5">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Source Design</label>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-700">PNG / JPG / WEBP</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
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
                    if (file) void loadFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative w-full overflow-hidden rounded-2xl border-2 border-dashed py-8 transition-all ${
                    isDragOver
                      ? "border-[#ff1a1a] bg-[#ff1a1a]/10"
                      : "border-white/10 bg-white/[0.02] hover:border-[#ff1a1a]/40 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="absolute inset-0 bg-[#ff1a1a]/0 transition-colors group-hover:bg-[#ff1a1a]/5" />
                  <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all group-hover:border-[#ff1a1a]/30 group-hover:text-[#ff1a1a]">
                      {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-300">
                        {isUploading ? "Uploading textile..." : localPreviewUrl ? "Change textile design" : "Drop textile design or browse"}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                        Source image powers the local and backend stack
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ColorControl
                  label="Target Color"
                  color={draft.target_color_hex}
                  onChange={(color) => updateDraft("target_color_hex", color)}
                />
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-2">Scope</label>
                  <select
                    className="w-full bg-black/40 p-2.5 rounded-lg border border-white/10 text-xs outline-none focus:border-red-500"
                    value={draft.recolor_scope}
                    onChange={(e) => {
                      const value = e.target.value as RecolorChange["recolor_scope"];
                      updateDraft("recolor_scope", value);
                      if (value === "whole_design") setUseSourceColor(false);
                    }}
                  >
                    <option value="selected_area">Selected Area</option>
                    <option value="whole_design">Whole Design</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ColorControl label="Source Color" color={sourceColor} onChange={setSourceColor} />
                <label className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/10 mt-6 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={useSourceColor}
                    onChange={(e) => setUseSourceColor(e.target.checked)}
                    className="accent-red-600"
                  />
                  Use source color
                </label>
              </div>

              <p className="text-[10px] text-white/30 leading-relaxed">
                Selected Area mode me preview par click karke source color automatically pick kar sakte ho.
              </p>

              <div className="space-y-4 pt-2">
                {sliderControls.map((control) => (
                  <div key={control.key}>
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40 mb-1.5">
                      <span>{control.label}</span>
                      <span className="text-red-500">{draft[control.key]}</span>
                    </div>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={draft[control.key]}
                      onChange={(e) => updateDraft(control.key, Number(e.target.value) as never)}
                      className="h-1 w-full cursor-pointer appearance-none rounded-full accent-white"
                      style={{
                        background: `linear-gradient(to right, #ff1a1a 0%, #ff1a1a ${
                          ((Number(draft[control.key]) - control.min) / (control.max - control.min)) * 100
                        }%, rgba(255,255,255,0.1) ${
                          ((Number(draft[control.key]) - control.min) / (control.max - control.min)) * 100
                        }%, rgba(255,255,255,0.1) 100%)`,
                      }}
                    />
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/10 text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={draft.preserve_lightness}
                  onChange={(e) => updateDraft("preserve_lightness", e.target.checked)}
                  className="accent-red-600"
                />
                Preserve Lightness
              </label>

              <div className="grid grid-cols-2 gap-3">
                <SmallButton onClick={() => setPreviewMode("mask")}>Show Mask Area</SmallButton>
                <SmallButton onClick={() => setPreviewMode("recolor")}>Show Stack Preview</SmallButton>
              </div>

              <button
                type="button"
                onClick={applyCurrentLayer}
                className="group relative w-full overflow-hidden rounded-2xl bg-[#ff1a1a] py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_25px_rgba(255,26,26,0.18)] transition-all hover:bg-red-700 hover:shadow-[0_0_35px_rgba(255,26,26,0.28)] active:scale-[0.98]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Layers className="h-4 w-4" /> Apply Layer <ChevronRight className="h-4 w-4" />
                </span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <SmallButton onClick={renderBackendPreview}>
                  {isRendering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Server className="h-3.5 w-3.5" />}
                  Backend Preview
                </SmallButton>
                <button
                  type="button"
                  onClick={saveFinalImage}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600/80 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Final
                </button>
              </div>

              <button
                type="button"
                onClick={resetAll}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-transparent py-3 text-[10px] font-bold uppercase tracking-widest text-white/35 transition-colors hover:bg-white/5 hover:text-white/60"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset All
              </button>

              <AnimatePresence>
                {status && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`rounded-lg border p-3 text-xs leading-relaxed ${
                    status.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                      : status.type === "error"
                        ? "bg-red-500/10 border-red-500/20 text-red-200"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-200"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    {status.type === "success" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    {status.message}
                  </span>
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Stat label="Session" value={sessionId || "Not created"} />
              <Stat label="Mode" value={previewMode === "mask" ? "Mask Preview" : "Stack Preview"} />
              <Stat label="Target" value={draft.target_color_hex} />
              <Stat label="Source" value={useSourceColor ? sourceColor : "Disabled"} />
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <Layers className="h-3.5 w-3.5 text-[#ff1a1a]" /> Active Layers
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-mono">{appliedChanges.length}</span>
            </div>
            {appliedChanges.length ? (
              appliedChanges.map((layer, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={`${layer.target_color_hex}-${index}`}
                  className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl border border-white/10" style={{ backgroundColor: layer.target_color_hex }} />
                    <div>
                      <span className="block text-xs font-bold text-white/80">Layer {index + 1}</span>
                      <span className="text-[10px] text-gray-600">{layer.recolor_scope} / {layer.strength}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedChanges((layers) => layers.filter((_, itemIndex) => itemIndex !== index));
                      setUiStatus("Layer deleted.", "success");
                    }}
                    className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    title="Delete layer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-[11px] text-white/30">
                Abhi koi applied change nahi hai.
              </p>
            )}
          </div>
        </aside>

        <main className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
            <div className="flex flex-col gap-3 px-2 pt-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-white">
                  <Palette className="h-5 w-5 text-[#ff1a1a]" /> Preview Workspace
                </h2>
                <p className="mt-1 text-xs text-gray-500">Click the local canvas to sample a source color.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ModePill active={activePreview === "canvas"} icon={<Eye className="h-3 w-3" />}>
                  Local Stack
                </ModePill>
                <ModePill active={activePreview === "backend"} icon={<Server className="h-3 w-3" />}>
                  Backend Result
                </ModePill>
              </div>
            </div>

          <div className="relative aspect-video flex items-center justify-center overflow-hidden rounded-[24px] border border-white/5 bg-black shadow-inner group">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            {localPreviewUrl ? (
              <>
                <canvas
                  ref={previewCanvasRef}
                  onClick={pickSourceColorFromCanvas}
                  className={`max-h-full max-w-full object-contain transition-transform duration-500 ${activePreview === "canvas" ? "block" : "hidden"}`}
                />
                {backendResultUrl && (
                  <img
                    src={`${backendResultUrl}?t=${Date.now()}`}
                    alt="Backend result"
                    className={`max-h-full max-w-full object-contain transition-transform duration-500 ${activePreview === "backend" ? "block" : "hidden"}`}
                  />
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <ImageIcon className="h-7 w-7 text-white/20" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/25">Awaiting Input Data</p>
                <p className="mt-2 text-[11px] text-gray-700">Upload a textile design to start recoloring.</p>
              </div>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setPreviewMode("recolor");
                  setActivePreview("canvas");
                }}
                className="text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest"
              >
                Stack
              </button>
              <div className="h-4 w-[1px] bg-white/10 mx-2" />
              <span className="text-[10px] font-mono text-white/40">{previewMode === "mask" ? "MASK" : "RECOLOR"}</span>
              <div className="h-4 w-[1px] bg-white/10 mx-2" />
              <button
                type="button"
                onClick={() => (backendResultUrl ? setActivePreview("backend") : setUiStatus("No backend result available yet. Click Backend Preview first.", "error"))}
                className="text-[10px] font-bold text-red-500 uppercase tracking-widest"
              >
                Backend
              </button>
            </div>
          </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 p-3">
                <Zap className="h-5 w-5 text-[#ff1a1a]" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">Cloud GPU Processing Active</p>
                <p className="text-[10px] text-white/40">Large files may take up to <span className="text-white/60">1-2 minutes</span>.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={saveFinalImage}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Result
            </button>
          </div>

          <div className="bg-[#141414]/50 border border-white/5 rounded-xl p-4 text-[11px] leading-relaxed text-white/40">
            <p className="mb-3">
              <span className="font-bold text-white/70">How to use:</span> Upload image, pick source color from preview or color input,
              adjust controls, apply layers, then render backend preview or save final image.
            </p>
            <p>
              <span className="font-bold text-white/70">Original URL:</span>{" "}
              {originalUrl ? <a className="text-red-400 break-all" href={originalUrl} target="_blank" rel="noreferrer">{originalUrl}</a> : "-"}
            </p>
            <p>
              <span className="font-bold text-white/70">Backend Preview / Final URL:</span>{" "}
              {backendResultUrl ? <a className="text-red-400 break-all" href={backendResultUrl} target="_blank" rel="noreferrer">{backendResultUrl}</a> : "-"}
            </p>
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}

function ColorControl({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-2">{label}</label>
      <div className="flex items-center gap-3 bg-black/40 p-2 rounded-lg border border-white/10">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent"
        />
        <span className="text-xs font-mono">{color.toUpperCase()}</span>
      </div>
    </div>
  );
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function ModePill({
  active,
  icon,
  children,
}: {
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
        active
          ? "border-[#ff1a1a]/30 bg-[#ff1a1a]/10 text-[#ff1a1a]"
          : "border-white/10 bg-white/5 text-gray-600"
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
      <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-[11px] text-white/70 font-mono break-words">{value}</div>
    </div>
  );
}
