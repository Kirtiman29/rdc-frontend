import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Layers,
  Link,
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
  ChevronDown,
} from "lucide-react";
import {
  invokeAiTool,
  normalizeAiOutputUrl,
  uploadAiInputAsset,
} from "@/api/aiApi";

import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";

import gptImage2Showcase from "@/assets/gpt-image2-showcase.png";
import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";

const slideshowImages = [pattern1, pattern2, pattern3, pattern4];

const faqs = [
  {
    question: "Can I use these images for my personal or commercial project?",
    answer: "Yes! All designs generated through RDC AI Studio are royalty-free. You hold full rights to use them for both personal and commercial projects, including marketing, product printing, social media, and digital publishing.",
  },
  {
    question: "If I generate content, will it be made available for other customers?",
    answer: "No. Your generated patterns and designs are private to your account and saved under 'My Designs'. They will not be displayed, shared, or made available to other customers unless you explicitly choose to publish them.",
  },
  {
    question: "For content I generate, will it be mine exclusively?",
    answer: "You have full commercial usage rights to your outputs. However, because AI models can generate similar results for similar prompts, the underlying imagery is not legally patentable or exclusively owned in terms of copyright protection, similar to standard generative AI terms.",
  },
  {
    question: "Do you have any safeguards for inappropriate content?",
    answer: "Yes, we employ robust automated safety filters. Any prompts or uploaded images that contain explicit, offensive, or inappropriate content are blocked automatically prior to generation. If a generated image bypasses the filters, please report it immediately.",
  },
  {
    question: "Can I write a prompt in other languages besides English?",
    answer: "Yes! Our AI systems support multi-lingual input and can interpret prompts written in Spanish, French, German, Hindi, and many other major languages. However, English prompts generally produce the most accurate and detailed patterns.",
  },
  {
    question: "How do I report results that seem weird/offensive/illegal?",
    answer: "If you encounter a generated result that is offensive or inappropriate, you can click on the support/report link in the page footer or contact our support team directly. We review reports and adjust safety guidelines constantly.",
  },
  {
    question: "How do I start making AI generated images?",
    answer: "It is simple! Just write a description of the design you want in the prompt textbox, select your style and aspect ratio, and click 'Generate Design'. Our studio will create your visuals in seconds.",
  },
];

const RECOLOR_CREDIT_COST = 4;

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

  // Slideshow state
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

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
    <div className="bg-[#111315] text-[#F5F7FA] relative pb-6">
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #E11D2E;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(225, 29, 46, 0.5);
        }
        .slider-thumb::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #E11D2E;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(225, 29, 46, 0.5);
        }
      `}</style>

      {/* Top Wrapper to limit Background Slideshow to Header and Generator Card */}
      <div className="relative w-full">
        {/* Background Slideshow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeSlide}
              src={slideshowImages[activeSlide]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.45, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#111315]/85 to-[#111315]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1480px] flex-col gap-8 p-5 md:p-7 xl:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#2B3138]/60 pb-6 mt-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2B3138] bg-[#1C2025] px-3 py-1 text-xs font-semibold text-[#A1A8B3]">
              <Sparkles className="h-3.5 w-3.5 text-[#E11D2E]" />
              RDC AI Studio
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
              Recolor Studio: Colorway Editor
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="grid grid-cols-2 gap-4 text-right">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-[#A1A8B3]">Session Status</p>
                <p className="text-xs font-bold text-white">{sessionId ? "Active" : "Inactive"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-[#A1A8B3]">Applied Layers</p>
                <p className="text-xs font-bold text-white">{appliedChanges.length}</p>
              </div>
            </div>
            <Link
              to="/ai-studio"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#2B3138] bg-[#20242A] px-5 text-sm font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31] self-start sm:self-auto"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

          {/* Generator panel and slideshow slider */}          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-8 items-start relative z-30">
            {/* Left Column: Vertical Settings Card */}
            <div className="w-full rounded-[24px] border border-[#2B3138]/30 bg-[#181B1F]/90 p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-5">
              
              {/* Source Design */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#A1A8B3]">Source Design</label>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">PNG / JPG / WEBP</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
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
                  className={`group relative w-full overflow-hidden rounded-xl border border-dashed py-3.5 transition-all ${
                    isDragOver
                      ? "border-[#E11D2E] bg-[#E11D2E]/10"
                      : "border-[#2B3138]/60 bg-[#111315]/40 hover:border-[#E11D2E]/50 hover:bg-[#111315]/60"
                  }`}
                >
                  <div className="relative z-10 flex items-center gap-3 px-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2B3138] bg-[#1C2025] text-[#A1A8B3] group-hover:border-[#E11D2E]/50 group-hover:text-[#E11D2E]">
                      {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">
                        {isUploading ? "Uploading..." : localPreviewUrl ? "Replace design" : "Upload design"}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Drag & drop or click</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Target / Source Colors */}
              <div className="grid grid-cols-2 gap-4">
                <ColorControl
                  label="Target Color"
                  color={draft.target_color_hex}
                  onChange={(color) => updateDraft("target_color_hex", color)}
                />
                <ColorControl label="Source Color" color={sourceColor} onChange={updateSourceColor} />
              </div>

              {/* Checkboxes */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-lg border border-[#2B3138] bg-[#111315]/40 p-2.5 text-[11px] text-white hover:bg-[#111315]/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSourceColor}
                    onChange={(e) => updateUseSourceColor(e.target.checked)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded border border-[#E11D2E] flex items-center justify-center transition-colors ${useSourceColor ? 'bg-[#E11D2E]' : 'bg-transparent'}`}>
                    {useSourceColor && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span>Use Source Color</span>
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-[#2B3138] bg-[#111315]/40 p-2.5 text-[11px] text-white hover:bg-[#111315]/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.preserve_lightness}
                    onChange={(e) => updateDraft("preserve_lightness", e.target.checked)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded border border-[#E11D2E] flex items-center justify-center transition-colors ${draft.preserve_lightness ? 'bg-[#E11D2E]' : 'bg-transparent'}`}>
                    {draft.preserve_lightness && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span>Preserve Light</span>
                </label>
              </div>

              {/* Recolor Sliders */}
              <div className="space-y-3.5">
                <RecolorSliderControls
                  controls={sliderControls}
                  draft={draft}
                  onChange={updateNumericDraft}
                  dense
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 border-t border-[#2B3138]/40 pt-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={resetAll}
                    className="flex items-center gap-2 rounded-xl border border-[#2B3138] bg-[#20242A] px-4 py-2 text-xs font-bold text-[#A1A8B3] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31] hover:text-[#F5F7FA] h-10 flex-1 justify-center"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset Workspace</span>
                  </button>

                  <div className="text-right ml-4">
                    <p className="text-[9px] uppercase tracking-wider text-[#A1A8B3]">Cost</p>
                    <p className="text-xs font-bold text-[#ff9ba5]">{RECOLOR_CREDIT_COST} Credits</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2B3138] bg-[#20242A] py-2.5 text-xs font-bold text-white transition hover:border-[#E11D2E]/50 hover:bg-[#252A31] h-10"
                  disabled={!sessionId || isUploading || isPreviewing}
                >
                  {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span>Generate Preview</span>
                </button>

                <button
                  type="button"
                  onClick={applyCurrentLayer}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E11D2E] py-2.5 text-xs font-bold text-white transition hover:bg-[#FF3347] disabled:opacity-40 h-10"
                  disabled={!originalImageElement || isPreviewing}
                >
                  <Layers className="h-4 w-4" />
                  <span>Apply Layer</span>
                </button>

                <button
                  type="button"
                  onClick={saveFinalImage}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E11D2E] bg-white/5 py-2.5 text-xs font-bold text-[#E11D2E] hover:bg-[#E11D2E]/10 disabled:opacity-40 h-10"
                  disabled={!sessionId || isSaving || isPreviewing}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Final Design</span>
                </button>
              </div>

              {status && (
                <div className={`rounded-lg border p-3 text-xs leading-relaxed ${
                  status.type === "success"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : status.type === "error"
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                }`}>
                  <span className="flex items-start gap-2">
                    {status.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Target className="h-4 w-4 shrink-0" />}
                    {status.message}
                  </span>
                </div>
              )}

            </div>

            {/* Right Column: Previews / Workspace */}
            <div className="w-full">
              {!localPreviewUrl ? (
                <div 
                  className="flex flex-col items-center justify-center py-24 px-8 text-center rounded-[24px] border border-dashed border-[#2B3138] bg-[#181B1F]/40 hover:bg-[#181B1F]/60 transition-all cursor-pointer min-h-[500px]" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#2B3138] bg-[#181B1F] mb-5">
                    <ImageIcon className="h-9 w-9 text-[#6B7280]" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Recolor Studio Workspace</h2>
                  <p className="mt-2 max-w-sm text-sm text-[#A1A8B3]">
                    Upload a textile design to begin recoloring and compare before and after previews. Click canvas to sample source colors.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Previews Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-[#2B3138] bg-[#181B1F]">
                      <div className="flex items-center justify-between border-b border-[#2B3138]/60 px-4 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Before</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Original</span>
                      </div>
                      <div className="relative flex items-center justify-center p-4 bg-black/40 aspect-square w-full">
                        <img
                          src={localPreviewUrl}
                          alt="Original textile design"
                          className="h-full max-w-full rounded-lg object-contain shadow-md"
                        />
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#2B3138] bg-[#181B1F]">
                      <div className="flex items-center justify-between border-b border-[#2B3138]/60 px-4 py-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">After</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Local Preview</span>
                      </div>
                      <div className="relative flex cursor-crosshair items-center justify-center p-4 bg-black/40 aspect-square w-full">
                        <canvas
                          ref={previewCanvasRef}
                          onClick={pickSourceColorFromCanvas}
                          className="h-full max-w-full rounded-lg object-contain shadow-md"
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
                          className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition-all hover:scale-105"
                          title="Preview full image"
                        >
                          <Maximize className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 transition-all hover:scale-105 hover:bg-red-500/20"
                          title="Remove image"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status & Export Controls Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* GPU Processing Card */}
                    <div className="lg:col-span-5 rounded-2xl border border-[#2B3138] bg-[#181B1F] p-6 flex flex-col justify-between shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-[#E11D2E]/10 border border-[#E11D2E]/20 p-3 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-[#E11D2E]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">AI Processing Active</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Advanced GPU recolor acceleration active.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={saveFinalImage}
                        disabled={!sessionId || isSaving || isPreviewing}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E11D2E] py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#FF3347] disabled:opacity-40 shadow-[0_4px_12px_rgba(225,29,46,0.3)]"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        <span>Export Final Design</span>
                      </button>
                    </div>

                    {/* Sessions & Layers Card */}
                    <div className="lg:col-span-7 rounded-2xl border border-[#2B3138] bg-[#181B1F] p-6 shadow-lg">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Stat label="Session ID" value={sessionId || "Not created"} />
                        <Stat label="Target Color" value={draft.target_color_hex} />
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <span className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
                          <Layers className="h-3.5 w-3.5 text-[#E11D2E]" /> Applied Layers
                        </span>
                        <span className="rounded-full border border-[#2B3138] bg-[#1C2025] px-2.5 py-0.5 text-xs font-mono text-gray-400">{appliedChanges.length}</span>
                      </div>

                      {appliedChanges.length ? (
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                          {appliedChanges.map((layer, index) => (
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={`${layer.target_color_hex}-${index}`}
                              className="flex items-center justify-between gap-4 rounded-xl border border-[#2B3138]/60 bg-[#111315]/40 p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg border border-white/10" style={{ backgroundColor: layer.target_color_hex }} />
                                <div>
                                  <span className="block text-xs font-semibold text-white">Layer {index + 1}</span>
                                  <span className="text-[10px] text-gray-500">Strength: {layer.strength}</span>
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
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-[#2B3138] p-6 text-center text-xs text-gray-600">
                          No layers applied yet. Configure parameters and apply your first recolor layer.
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#E11D2E]">Live Recolor Controls</p>
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
                    className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#E11D2E] py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#FF3347] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Layers className="h-5 w-5" />
                    Apply Layer
                  </button>
                  <button
                    type="button"
                    onClick={saveFinalImage}
                    disabled={!sessionId || isSaving || isPreviewing}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E11D2E] bg-white/5 py-3 text-sm font-semibold uppercase tracking-wide text-[#E11D2E] transition-colors hover:bg-[#E11D2E]/10 disabled:cursor-not-allowed disabled:opacity-50"
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
          AI Recolor Studio: FAQs
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
