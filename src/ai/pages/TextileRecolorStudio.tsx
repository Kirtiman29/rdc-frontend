import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Layers,
  Loader2,
  Maximize,
  Palette,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import {
  invokeAiTool,
  normalizeAiOutputUrl,
  uploadAiInputAsset,
} from "@/api/aiApi";

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
type NumericRecolorKey = "strength" | "saturation" | "brightness" | "tolerance" | "area_coverage" | "mask_blur";
type SliderControl = {
  label: string;
  key: NumericRecolorKey;
  min: number;
  max: number;
  step: number;
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

const defaultDraft: RecolorChange = {
  source_color_hex: null,
  target_color_hex: "#e11d48",
  strength: 0.7,
  saturation: 1,
  brightness: 1,
  tolerance: 40,
  mask_blur: 5,
  preserve_lightness: true,
  recolor_scope: "selected_area",
  area_coverage: 50,
};

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

const isAllowedImageFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return (
    ALLOWED_IMAGE_TYPES.includes(file.type) ||
    ALLOWED_IMAGE_EXTENSIONS.some((extension) => fileName.endsWith(extension))
  );
};

function buildColorwayChange(change: RecolorChange): RecolorChange {
  return {
    source_color_hex: change.source_color_hex && HEX_COLOR_PATTERN.test(change.source_color_hex)
      ? change.source_color_hex.toUpperCase()
      : null,
    target_color_hex: change.target_color_hex.toUpperCase(),
    strength: clamp(change.strength, 0, 1),
    saturation: clamp(change.saturation, 0.1, 3),
    brightness: clamp(change.brightness, 0.1, 3),
    tolerance: clamp(change.tolerance, 1, 150),
    mask_blur: clamp(change.mask_blur, 0, 25),
    preserve_lightness: change.preserve_lightness,
    recolor_scope: change.recolor_scope,
    area_coverage: clamp(change.area_coverage, 0, 100),
  };
}

function changesMatch(first: RecolorChange, second: RecolorChange) {
  return JSON.stringify(buildColorwayChange(first)) === JSON.stringify(buildColorwayChange(second));
}

async function uploadColorwayImage(file: File) {
  const inputUrl = await uploadAiInputAsset(file);

  return {
    inputUrl,
    originalImageUrl: inputUrl,
  };
}

async function requestColorwayPreview(
  inputUrl: string,
  changes: RecolorChange[]
) {
  const sanitizedChanges = changes.map(buildColorwayChange);
  const activeChange = sanitizedChanges[sanitizedChanges.length - 1];

  if (!activeChange) {
    throw new Error("No recolor changes available for preview.");
  }

  const response = await invokeAiTool({
    toolName: "COLORWAY",
    inputUrl,
    params: {
      changes: sanitizedChanges,
      source_color_hex: activeChange.source_color_hex,
      target_color_hex: activeChange.target_color_hex,
      strength: activeChange.strength,
      saturation: activeChange.saturation,
      brightness: activeChange.brightness,
      tolerance: activeChange.tolerance,
      mask_blur: activeChange.mask_blur,
      preserve_lightness: activeChange.preserve_lightness,
      recolor_scope: activeChange.recolor_scope,
      area_coverage: activeChange.area_coverage,
    },
  });

  if (!response.success) {
    throw new Error(response.message || "Preview generation failed");
  }

  const outputData =
    response.outputData && typeof response.outputData === "object"
      ? (response.outputData as {
          preview_url?: string;
          final_image_url?: string;
        })
      : null;
  const previewUrl =
    response.outputUrl || outputData?.preview_url || outputData?.final_image_url || "";

  return {
    previewUrl: normalizeAiOutputUrl(previewUrl),
  };
}

async function saveColorwayFinal(
  inputUrl: string,
  changes: RecolorChange[]
) {
  const sanitizedChanges = changes.map(buildColorwayChange);
  const activeChange = sanitizedChanges[sanitizedChanges.length - 1];

  if (!activeChange) {
    throw new Error("No recolor changes available to save.");
  }

  const response = await invokeAiTool({
    toolName: "COLORWAY",
    inputUrl,
    params: {
      save_final: true,
      changes: sanitizedChanges,
      source_color_hex: activeChange.source_color_hex,
      target_color_hex: activeChange.target_color_hex,
      strength: activeChange.strength,
      saturation: activeChange.saturation,
      brightness: activeChange.brightness,
      tolerance: activeChange.tolerance,
      mask_blur: activeChange.mask_blur,
      preserve_lightness: activeChange.preserve_lightness,
      recolor_scope: activeChange.recolor_scope,
      area_coverage: activeChange.area_coverage,
    },
  });

  if (!response.success) {
    throw new Error(response.message || "Final image save failed");
  }

  const outputData =
    response.outputData && typeof response.outputData === "object"
      ? (response.outputData as {
          final_image_url?: string;
          preview_url?: string;
        })
      : null;
  const finalUrl =
    response.outputUrl || outputData?.final_image_url || outputData?.preview_url || "";

  return normalizeAiOutputUrl(finalUrl);
}

async function downloadRemoteAsset(url: string, filename: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Export was created, but the final image could not be downloaded.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    if (error instanceof Error && error.message.includes("could not be downloaded")) {
      throw error;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
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
  const [uploadedInputUrl, setUploadedInputUrl] = useState<string | null>(null);
  const [originalImageElement, setOriginalImageElement] = useState<HTMLImageElement | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [backendResultUrl, setBackendResultUrl] = useState<string | null>(null);
  const [sourceColor, setSourceColor] = useState("#dc2626");
  const [useSourceColor, setUseSourceColor] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [backendPreviewUrl, setBackendPreviewUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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
    renderStackPreviewLocal();

    if (showPreview && !backendPreviewUrl && !backendResultUrl && previewCanvasRef.current) {
      setPreviewImageUrl(previewCanvasRef.current.toDataURL("image/png"));
    }
  }, [originalImageElement, appliedChanges, draft, sourceColor, useSourceColor, showPreview, backendPreviewUrl, backendResultUrl]);

  const setUiStatus = (message: string, type: "info" | "success" | "error" = "info") => {
    setStatus({ message, type });
  };

  const updateDraft = <T extends keyof RecolorChange>(key: T, value: RecolorChange[T]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setBackendPreviewUrl(null);
    setBackendResultUrl(null);
  };

  const updateSourceColor = (color: string) => {
    setSourceColor(color);
    setBackendPreviewUrl(null);
    setBackendResultUrl(null);
  };

  const updateUseSourceColor = (enabled: boolean) => {
    setUseSourceColor(enabled);
    setBackendPreviewUrl(null);
    setBackendResultUrl(null);
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

  async function prepareLocalPreview(file: File) {
    if (localObjectUrlRef.current) URL.revokeObjectURL(localObjectUrlRef.current);

    const url = URL.createObjectURL(file);
    localObjectUrlRef.current = url;
    setLocalPreviewUrl(url);
    setBackendResultUrl(null);

    const img = new Image();
    img.onload = () => setOriginalImageElement(img);
    img.src = url;
  }

  async function handleSelectedFile(file: File) {
    if (!isAllowedImageFile(file)) {
      setUiStatus("Only PNG, JPG, JPEG, and WEBP images are allowed.", "error");
      return;
    }

    await prepareLocalPreview(file);

    try {
      setIsUploading(true);
      setUiStatus("Uploading image...", "info");
      const uploadResult = await uploadColorwayImage(file);

      setUploadedInputUrl(uploadResult.inputUrl);
      setSessionId("gateway");
      setOriginalUrl(uploadResult.originalImageUrl);
      setAppliedChanges([]);
      setBackendPreviewUrl(null);
      setBackendResultUrl(null);
      setPreviewImageUrl(null);
      setShowPreview(false);
      setUiStatus("Image uploaded successfully. Configure your recolor parameters and apply changes.", "success");
    } catch (error) {
      setUploadedInputUrl(null);
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
    if (!canvas || !ctx || !originalImageElement) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (canvas.height / rect.height));
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    updateSourceColor(hex);
    updateUseSourceColor(true);
    setUiStatus(`Source color selected: ${hex}. Configure parameters and apply the change.`, "success");
  }

  function getCurrentChanges(includeDraft = true) {
    const changes = [...appliedChanges];
    const sanitizedDraft = buildColorwayChange(effectiveDraft);
    const lastAppliedChange = changes[changes.length - 1];

    if (includeDraft && (!lastAppliedChange || !changesMatch(lastAppliedChange, sanitizedDraft))) {
      changes.push(sanitizedDraft);
    }

    return changes.map(buildColorwayChange);
  }

  async function generateBackendPreview(changes = getCurrentChanges(true), options: { silent?: boolean } = {}) {
    if (!sessionId) {
      setUiStatus("Please upload an image first and ensure backend upload succeeds.", "error");
      return null;
    }

    if (!uploadedInputUrl) {
      setUiStatus("Uploaded input URL is missing.", "error");
      return null;
    }

    if (!changes.length) {
      setUiStatus("No color changes found for preview.", "error");
      return null;
    }

    try {
      setIsPreviewing(true);
      if (!options.silent) {
        setUiStatus(changes.length > 1 ? "Generating stacked preview..." : "Generating recolor preview...", "info");
      }

      const { previewUrl } = await requestColorwayPreview(uploadedInputUrl, changes);
      setBackendPreviewUrl(previewUrl);
      setPreviewImageUrl(previewUrl);
      setBackendResultUrl(null);

      if (!options.silent) {
        setUiStatus(changes.length > 1 ? "Stacked preview generated successfully." : "Preview generated successfully.", "success");
      }

      return previewUrl;
    } catch (error) {
      setUiStatus(error instanceof Error ? error.message : "Preview generation failed", "error");
      return null;
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleGeneratePreview() {
    await generateBackendPreview();
  }

  function applyCurrentLayer() {
    if (!originalImageElement) {
      setUiStatus("Please upload an image first.", "error");
      return;
    }

    const sanitizedDraft = buildColorwayChange(effectiveDraft);
    const lastAppliedChange = appliedChanges[appliedChanges.length - 1];
    const nextChanges = lastAppliedChange && changesMatch(lastAppliedChange, sanitizedDraft)
      ? appliedChanges.map(buildColorwayChange)
      : [...appliedChanges, sanitizedDraft].map(buildColorwayChange);

    setAppliedChanges(nextChanges);
    setBackendPreviewUrl(null);
    setBackendResultUrl(null);
    setUiStatus("Recolor layer applied to stack.", "success");

    if (sessionId) {
      void generateBackendPreview(nextChanges, { silent: true });
    }
  }

  async function saveFinalImage() {
    if (!sessionId) {
      setUiStatus("Please upload an image first and ensure backend upload succeeds.", "error");
      return;
    }

    if (!uploadedInputUrl) {
      setUiStatus("Uploaded input URL is missing.", "error");
      return;
    }

    try {
      setIsSaving(true);
      const changes = getCurrentChanges(true);
      setUiStatus(changes.length > 1 ? "Saving final stacked image..." : "Saving final recolored image...", "info");

      if (changes.length === 1) {
        const previewUrl = await generateBackendPreview(changes, { silent: true });
        if (!previewUrl) return;
      }

      const finalUrl = await saveColorwayFinal(uploadedInputUrl, changes);
      setBackendResultUrl(finalUrl);
      setPreviewImageUrl(finalUrl);
      await downloadRemoteAsset(finalUrl, `textile-recolor-${sessionId}.png`);
      setShowPreview(false);
      setUiStatus(changes.length > 1 ? "Final stacked image downloaded successfully." : "Final recolored image downloaded successfully.", "success");
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
    setUploadedInputUrl(null);
    updateSourceColor("#dc2626");
    updateUseSourceColor(false);
    setBackendPreviewUrl(null);
    setBackendResultUrl(null);
    setPreviewImageUrl(null);
    setShowPreview(false);
  }

  function removeImage() {
    setLocalPreviewUrl(null);
    setOriginalImageElement(null);
    setBackendPreviewUrl(null);
    setBackendResultUrl(null);
    setUploadedInputUrl(null);
    setOriginalUrl(null);
    setSessionId(null);
    setAppliedChanges([]);
    setPreviewImageUrl(null);
    setShowPreview(false);

    if (localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
      localObjectUrlRef.current = null;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const updateNumericDraft = (key: NumericRecolorKey, value: number) => {
    updateDraft(key, value);
  };

  const sliderControls: SliderControl[] = [
    { label: "Recolor Strength", key: "strength" as const, min: 0, max: 1, step: 0.05 },
    { label: "Fabric Saturation", key: "saturation" as const, min: 0.1, max: 3, step: 0.1 },
    { label: "Brightness", key: "brightness" as const, min: 0.1, max: 3, step: 0.1 },
    { label: "Area Tolerance", key: "tolerance" as const, min: 1, max: 150, step: 1 },
    { label: "Area Coverage", key: "area_coverage" as const, min: 0, max: 100, step: 1 },
    { label: "Mask Blur", key: "mask_blur" as const, min: 0, max: 25, step: 1 },
  ];
  const previewAspectRatio = originalImageElement
    ? `${originalImageElement.naturalWidth} / ${originalImageElement.naturalHeight}`
    : "4 / 3";

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans selection:bg-[#ff1a1a]/30">
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ff1a1a;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(255, 26, 26, 0.5);
        }
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ff1a1a;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(255, 26, 26, 0.5);
        }
      `}</style>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[#ff1a1a]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff1a1a]/30 bg-[#ff1a1a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#ff1a1a]">
              <Sparkles className="h-4 w-4" /> Textile Recolor Engine v2.0
            </div>
            <h1 className="text-5xl font-bold uppercase tracking-tight text-white md:text-6xl">
              Recolor <span className="text-gray-600 font-normal">Studio</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-400">
              Professional textile colorway creation with advanced local preview, precise color sampling, and layered export capabilities.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-right">
            <Metric label="Session Status" value={sessionId ? "Active" : "Inactive"} />
            <Metric label="Applied Layers" value={appliedChanges.length} />
          </div>
        </motion.header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-4 space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-lg">
              <h2 className="mb-8 flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-gray-300">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff1a1a]/30 bg-[#ff1a1a]/10 text-[#ff1a1a]">
                  <SlidersHorizontal className="h-5 w-5" />
                </span>
                Recolor Parameters
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <label className="text-sm font-medium uppercase tracking-wide text-gray-400">Source Design</label>
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">PNG / JPG / WEBP</span>
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                    className={`group relative w-full overflow-hidden rounded-xl border-2 border-dashed py-10 transition-all ${
                      isDragOver
                        ? "border-[#ff1a1a] bg-[#ff1a1a]/10"
                        : "border-white/20 bg-white/5 hover:border-[#ff1a1a]/50 hover:bg-[#ff1a1a]/5"
                    }`}
                  >
                    <div className="absolute inset-0 bg-[#ff1a1a]/0 transition-colors group-hover:bg-[#ff1a1a]/5" />
                    <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 transition-all group-hover:border-[#ff1a1a]/50 group-hover:text-[#ff1a1a]">
                        {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white">
                          {isUploading ? "Uploading textile..." : localPreviewUrl ? "Replace design" : "Upload textile design"}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Drag and drop or click to browse. High-resolution images recommended.
                        </p>
                      </div>
                    </div>
                  </motion.button>
                </div>

                <ColorControl
                  label="Target Color"
                  color={draft.target_color_hex}
                  onChange={(color) => updateDraft("target_color_hex", color)}
                />

                <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                  <ColorControl label="Source Color" color={sourceColor} onChange={updateSourceColor} />
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium uppercase tracking-wide text-gray-400">Enable Source Color</label>
                    <label className="flex min-h-[104px] items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white transition-colors hover:bg-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSourceColor}
                        onChange={(e) => updateUseSourceColor(e.target.checked)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded border-2 border-[#ff1a1a] flex items-center justify-center transition-colors ${useSourceColor ? 'bg-[#ff1a1a]' : 'bg-transparent'}`}>
                        {useSourceColor && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      Enable source color
                    </label>
                  </div>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed">
                  Click on the preview canvas to automatically sample a source color from your design.
                </p>

                <RecolorSliderControls
                  controls={sliderControls}
                  draft={draft}
                  onChange={updateNumericDraft}
                />

                <label className="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/10 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={draft.preserve_lightness}
                    onChange={(e) => updateDraft("preserve_lightness", e.target.checked)}
                    className="accent-[#ff1a1a] rounded"
                  />
                  Preserve Lightness
                </label>

                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 py-4 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition-all hover:bg-white/10 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!sessionId || isUploading || isPreviewing}
                >
                  {isPreviewing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  Generate Preview
                </button>

                <button
                  type="button"
                  onClick={applyCurrentLayer}
                  className="group relative w-full overflow-hidden rounded-xl bg-[#ff1a1a] py-4 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition-all hover:bg-[#ff0000] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!originalImageElement || isPreviewing}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <Layers className="h-5 w-5" /> Apply Layer <ChevronRight className="h-5 w-5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={saveFinalImage}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#ff1a1a] bg-white/5 py-4 text-sm font-semibold uppercase tracking-wide text-[#ff1a1a] shadow-lg transition-all hover:bg-[#ff1a1a]/10 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                  disabled={!sessionId || isSaving || isPreviewing}
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Save Final Image
                </button>

                <button
                  type="button"
                  onClick={resetAll}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-transparent py-3 text-sm font-semibold uppercase tracking-wide text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Workspace
                </button>

                <AnimatePresence>
                  {status && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`rounded-lg border p-4 text-sm leading-relaxed ${
                        status.type === "success"
                          ? "bg-green-500/20 border-green-500/50 text-green-300"
                          : status.type === "error"
                            ? "bg-red-500/20 border-red-500/50 text-red-300"
                            : "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        {status.type === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <Target className="mt-0.5 h-5 w-5 shrink-0" />}
                        {status.message}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </aside>

          <main className="lg:col-span-8 flex flex-col gap-8">
            <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg">
              <div className="flex flex-col gap-4 px-2 pt-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="flex items-center gap-3 text-xl font-semibold uppercase tracking-tight text-white">
                    <Palette className="h-6 w-6 text-[#ff1a1a]" /> Before / After Preview
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">Compare the original design with the recolored result. Click the After canvas to sample a color.</p>
                </div>
              </div>

              {!localPreviewUrl ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-[#0a0a0a]">
                  <div className="px-6 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                      <ImageIcon className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-lg font-semibold uppercase tracking-wide text-gray-500">Awaiting Design Input</p>
                    <p className="mt-3 max-w-md text-sm text-gray-600">Upload a textile design to begin recoloring and compare before and after previews.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Before</span>
                      <span className="text-xs text-gray-600">Original</span>
                    </div>
                    <div className="flex items-center justify-center" style={{ aspectRatio: previewAspectRatio }}>
                      <img
                        src={localPreviewUrl}
                        alt="Original textile design"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">After</span>
                      <span className="text-xs text-gray-600">Local Preview</span>
                    </div>
                    <div className="relative flex cursor-crosshair items-center justify-center" style={{ aspectRatio: previewAspectRatio }}>
                      <canvas
                        ref={previewCanvasRef}
                        onClick={pickSourceColorFromCanvas}
                        className="h-full w-full object-contain"
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (backendPreviewUrl) {
                            setPreviewImageUrl(backendPreviewUrl);
                            setShowPreview(true);
                          } else if (previewCanvasRef.current) {
                            const canvas = previewCanvasRef.current;
                            const dataUrl = canvas.toDataURL("image/png");
                            setPreviewImageUrl(dataUrl);
                            setShowPreview(true);
                          }
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute bottom-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/90"
                        title="Preview full image"
                      >
                        <Maximize className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 transition-all hover:scale-105 hover:bg-red-500/20"
                        title="Remove image"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-[#ff1a1a]/30 bg-[#ff1a1a]/10 p-4">
                  <Zap className="h-6 w-6 text-[#ff1a1a]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white uppercase tracking-wide">AI Processing Engine</p>
                  <p className="text-sm text-gray-500">Advanced GPU acceleration for complex recoloring tasks.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={saveFinalImage}
                disabled={!sessionId || isSaving || isPreviewing}
                className="flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white transition-all hover:bg-white/10 hover:shadow-md disabled:opacity-50 shadow-sm"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                Export Final Design
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Stat label="Session ID" value={sessionId || "Not created"} />
                <Stat label="Target Color" value={draft.target_color_hex} />
                <Stat label="Source Color" value={useSourceColor ? sourceColor : "Disabled"} />
                <Stat label="Scope" value={draft.recolor_scope === "selected_area" ? "Selected area" : "Whole design"} />
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  <Layers className="h-4 w-4 text-[#ff1a1a]" /> Applied Layers
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-mono text-gray-400">{appliedChanges.length}</span>
              </div>
              {appliedChanges.length ? (
                appliedChanges.map((layer, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={`${layer.target_color_hex}-${index}`}
                    className="mb-3 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl border border-white/20" style={{ backgroundColor: layer.target_color_hex }} />
                      <div>
                        <span className="block text-sm font-semibold text-white">Layer {index + 1}</span>
                        <span className="text-xs text-gray-500">Strength: {layer.strength}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedChanges((layers) => layers.filter((_, itemIndex) => itemIndex !== index));
                        setUiStatus("Layer removed.", "success");
                      }}
                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      title="Remove layer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-600">
                  No layers applied yet. Configure parameters and apply your first recolor layer.
                </p>
              )}
            </div>

          </main>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {(showPreview && (previewImageUrl || backendResultUrl)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 p-4"
          >
            <div className="grid h-full max-h-[94vh] w-full gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex min-h-0 items-center justify-center rounded-2xl border border-white/10 bg-[#050505] p-3">
                <motion.img
                  initial={{ scale: 0.96 }}
                  animate={{ scale: 1 }}
                  src={previewImageUrl ?? backendResultUrl ?? undefined}
                  className="h-full max-h-full w-full max-w-full rounded-xl object-contain shadow-2xl"
                  alt="Full recolor preview"
                />
              </div>

              <aside className="min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#ff1a1a]">Live Recolor Controls</p>
                  <h3 className="mt-2 text-xl font-semibold uppercase tracking-tight text-white">Full Preview</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    Tune the parameters while keeping the artwork large enough to inspect details.
                  </p>
                </div>

                <div className="mb-6">
                  <ColorControl
                    label="Target Color"
                    color={draft.target_color_hex}
                    onChange={(color) => updateDraft("target_color_hex", color)}
                  />
                </div>

                <RecolorSliderControls
                  controls={sliderControls}
                  draft={draft}
                  onChange={updateNumericDraft}
                  dense
                />

                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={!sessionId || isUploading || isPreviewing}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPreviewing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    Generate Backend Preview
                  </button>
                  <button
                    type="button"
                    onClick={applyCurrentLayer}
                    disabled={!originalImageElement || isPreviewing}
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#ff1a1a] py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#ff0000] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Layers className="h-5 w-5" />
                    Apply Layer
                  </button>
                  <button
                    type="button"
                    onClick={saveFinalImage}
                    disabled={!sessionId || isSaving || isPreviewing}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#ff1a1a] bg-white/5 py-3 text-sm font-semibold uppercase tracking-wide text-[#ff1a1a] transition-colors hover:bg-[#ff1a1a]/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save Final Image
                  </button>
                </div>
              </aside>
            </div>
            <button
              onClick={() => {
                setShowPreview(false);
                setPreviewImageUrl(null);
              }}
              className="absolute right-8 top-8 rounded-full bg-white/10 p-3 transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
  const [textValue, setTextValue] = useState(color.toUpperCase());

  useEffect(() => {
    setTextValue(color.toUpperCase());
  }, [color]);

  return (
    <div className="min-w-0">
      <label className="block text-sm font-medium uppercase tracking-wide text-gray-400 mb-3">{label}</label>
      <div className="grid min-w-0 grid-cols-[3.75rem_minmax(0,1fr)] items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-14 cursor-pointer rounded-xl border border-white/20 bg-transparent"
        />
        <div className="grid min-w-0 gap-2">
          <input
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value.toUpperCase())}
            onBlur={() => {
              if (/^#[0-9A-F]{6}$/.test(textValue)) {
                onChange(textValue);
              } else {
                setTextValue(color.toUpperCase());
              }
            }}
            className="w-full min-w-0 rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm font-mono text-white placeholder-gray-500 focus:border-[#ff1a1a] focus:outline-none focus:ring-1 focus:ring-[#ff1a1a]"
            placeholder="#FFFFFF"
          />
          <span className="text-xs leading-relaxed text-gray-500">Enter a valid hex code or use the picker.</span>
        </div>
      </div>
    </div>
  );
}

function RecolorSliderControls({
  controls,
  draft,
  onChange,
  dense = false,
}: {
  controls: SliderControl[];
  draft: RecolorChange;
  onChange: (key: NumericRecolorKey, value: number) => void;
  dense?: boolean;
}) {
  return (
    <div className={dense ? "space-y-4" : "space-y-5 pt-4"}>
      {controls.map((control) => {
        const value = draft[control.key];
        const percentage = ((value - control.min) / (control.max - control.min)) * 100;

        return (
          <div key={control.key}>
            <div className="mb-2 flex justify-between text-sm uppercase tracking-wide text-gray-500">
              <span>{control.label}</span>
              <span className="font-medium text-[#ff1a1a]">{value}</span>
            </div>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={value}
              onChange={(event) => onChange(control.key, Number(event.target.value))}
              className="slider-thumb h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20"
              style={{
                background: `linear-gradient(to right, #ff1a1a 0%, #ff1a1a ${percentage}%, #ffffff20 ${percentage}%, #ffffff20 100%)`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</div>
      <div className="text-sm text-gray-300 font-mono break-words">{value}</div>
    </div>
  );
}
