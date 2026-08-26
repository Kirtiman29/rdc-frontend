import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronDown,
  Download,
  Image as ImageIcon,
  Loader2,
  Maximize,
  Minus,
  Plus,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import AiCreditCost from "@/ai/components/AiCreditCost";
import {
  GEMINI_IMAGE_TO_IMAGE_ASPECT_RATIOS,
  enhancePrompt,
  generateGeminiImgToImg,
  getAiErrorMessage,
  type GenerateResponse,
  type GeminiImageToImageAspectRatio,
  type GeminiImageToImageMode,
  type TextToImageProvider,
} from "@/api/aiApi";

import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";

import gptImage2Showcase from "@/assets/gpt-image2-showcase.png";
import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";

const faqs = [
  {
    question: "What is RDC Pattern Maker?",
    answer: "The RDC Pattern Maker is an advanced visual variation engine powered by Gemini models. It takes an existing source design and uses your text prompt to intelligently modify elements, color schemes, or themes while respecting the design's structural flow.",
  },
  {
    question: "How do the Edit Modes work?",
    answer: "Auto dynamically determines the safe edit range. Edit targets specific parts of the layout described in your prompt, leaving other parts intact. Redesign reimagines the entire pattern from scratch, using the original image as a style/composition reference.",
  },
  {
    question: "Can I use these pattern variations commercially?",
    answer: "Yes, all variations generated within RDC AI Studio are completely royalty-free. You hold full rights to print, sell, publish, or distribute the outputs commercially for clothing, packaging, or digital media.",
  },
  {
    question: "What image formats and sizes are supported?",
    answer: "We support standard digital image formats including PNG, JPG, JPEG, and WEBP. For optimal processing and visual clarity, we recommend files under 10MB.",
  },
];

type GeneratedImage = GenerateResponse["images"][number];

const slideshowImages = [pattern1, pattern2, pattern3, pattern4];

const getPatternMakerDownloadName = (filename: string, index?: number) => {
  const fallbackName = `rdc-pattern-maker-${typeof index === "number" ? index + 1 : Date.now()}.png`;
  const trimmed = filename.trim();
  const candidate = trimmed || fallbackName;
  const extensionMatch = candidate.match(/\.(png|jpe?g|webp)$/i);
  const extension = extensionMatch?.[0].toLowerCase() ?? ".png";

  if (/(gemini|openai|gpt)/i.test(candidate)) {
    return fallbackName.replace(/\.png$/i, extension);
  }

  return candidate;
};

const aspectRatioLabels: Record<GeminiImageToImageAspectRatio, string> = {
  auto: "Auto (input image)",
  "1:1": "1:1",
  "2:3": "2:3",
  "3:2": "3:2",
  "3:4": "3:4",
  "4:3": "4:3",
  "4:5": "4:5",
  "5:4": "5:4",
  "9:16": "9:16",
  "16:9": "16:9",
  "21:9": "21:9",
};

const ALLOWED_GEMINI_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];
const ALLOWED_GEMINI_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_GEMINI_IMAGE_UPLOAD_BYTES = 120 * 1024 * 1024;

const editModeOptions: Array<{
  value: GeminiImageToImageMode;
  title: string;
  description: string;
}> = [
  { value: "auto", title: "Auto", description: "Chooses the safest mode automatically" },
  { value: "edit", title: "Edit", description: "Changes only the requested parts" },
  { value: "redesign", title: "Redesign", description: "Creates a new variation of the design" },
];

type PatternPromptPreset = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  recommendedMode: GeminiImageToImageMode;
  editType: string;
};

type PatternWorkflowStep = {
  title: string;
  description: string;
};

type ChangeStrengthOption = {
  value: 20 | 30 | 50;
  title: string;
  description: string;
  instruction: string;
  editMode: GeminiImageToImageMode;
  changeStrength: number;
  referenceStrength: number;
  promptStrength: number;
};

const patternWorkflowSteps: PatternWorkflowStep[] = [
  {
    title: "1. Upload Reference",
    description: "Use a clean flat textile tile or artwork image.",
  },
  {
    title: "2. Pick Direction",
    description: "Choose the closest preset to the designer intent.",
  },
  {
    title: "3. Set Change",
    description: "Start with 20% or 30% for production-safe variations.",
  },
  {
    title: "4. Generate & Select",
    description: "Create 2-4 options, keep the best, then refine again.",
  },
];

const UNIVERSAL_BASE_PROMPT =
  "Analyze the uploaded reference image's artwork style, motif family, illustration rendering technique (flat 2D vector, painted, block-print, line-art, or ornamental), color palette, and pattern composition. Create an intelligent textile pattern variation that respects the exact artistic style and motif identity of the uploaded artwork.";

const patternPromptPresets: PatternPromptPreset[] = [
  {
    id: "auto",
    title: "Auto-Adaptive (Universal)",
    description: "Auto-detects image style (floral, paisley, vector, block-print, etc.).",
    recommendedMode: "edit",
    editType: "controlled textile pattern variation",
    prompt: UNIVERSAL_BASE_PROMPT,
  },
  {
    id: "close-polish",
    title: "Reference Safe",
    description: "Closest textile variation with original flow preserved.",
    recommendedMode: "edit",
    editType: "controlled textile variation",
    prompt:
      "Use the uploaded textile artwork as the primary reference. Create a very similar flat textile pattern variation while preserving the original motif family, layout flow, motif scale, spacing, density, color mood, and repeat rhythm. Improve only print clarity, edge cleanliness, and color balance.",
  },
  {
    id: "floral-refresh",
    title: "Floral Studio",
    description: "Cleaner flowers and leaves without changing composition.",
    recommendedMode: "edit",
    editType: "controlled floral textile variation",
    prompt:
      "Create a refined floral textile variation from the uploaded design. Keep the same composition path, motif placement, floral scale, stem direction, leaf rhythm, and negative space. Improve flower definition, leaf detailing, print sharpness, and color harmony without turning it into a new layout.",
  },
  {
    id: "paisley-cleaner",
    title: "Paisley Cleaner",
    description: "Better paisley flow with less visual noise.",
    recommendedMode: "edit",
    editType: "controlled paisley textile variation",
    prompt:
      "Create a cleaner paisley textile variation from the uploaded image. Preserve paisley size, direction, spacing, curve flow, ornamental balance, and color family. Reduce muddy texture, improve line clarity, keep motifs elegant, and avoid overcrowding.",
  },
  {
    id: "ethnic-block",
    title: "Ethnic Block",
    description: "Controlled block-print feel from the same source.",
    recommendedMode: "edit",
    editType: "controlled block print textile variation",
    prompt:
      "Convert the uploaded design toward an Indian block-print textile style while preserving the source motif arrangement, repeat rhythm, motif scale, and spacing. Simplify shapes into handcrafted block-print forms, keep clean edges, and avoid changing the overall composition too much.",
  },
  {
    id: "luxury-ornamental",
    title: "Luxury Ornamental",
    description: "Premium motif language with richer detailing.",
    recommendedMode: "edit",
    editType: "controlled ornamental textile variation",
    prompt:
      "Create a premium ornamental textile variation inspired by the uploaded design. Keep the reference structure recognizable, preserve motif scale and layout rhythm, improve decorative line quality, add controlled refined detailing, and keep the artwork suitable for high-end fabric printing.",
  },
  {
    id: "minimal-repeat",
    title: "Minimal Repeat",
    description: "Cleaner, lighter version for subtle fabric prints.",
    recommendedMode: "edit",
    editType: "controlled minimal textile variation",
    prompt:
      "Create a lighter minimal textile variation from the uploaded image. Preserve the original flow, motif family, and repeat rhythm, but reduce visual clutter, simplify supporting details, balance empty space, and keep a clean print-ready textile tile.",
  },
  {
    id: "tropical-botanical",
    title: "Tropical Botanical",
    description: "Leafy tropical direction from the uploaded reference.",
    recommendedMode: "edit",
    editType: "controlled botanical textile variation",
    prompt:
      "Create a tropical botanical textile variation inspired by the uploaded image. Preserve the source composition flow, motif density, repeat spacing, and scale. Emphasize flowing foliage and botanical detailing while keeping the original textile layout readable.",
  },
];

const changeStrengthOptions: ChangeStrengthOption[] = [
  {
    value: 20,
    title: "20% Change",
    description: "Subtle shape & detail edit",
    editMode: "edit",
    changeStrength: 0.25,
    referenceStrength: 0.85,
    promptStrength: 0.5,
    instruction:
      "Apply 20% subtle studio variation. Keep the uploaded image as master reference. Match its illustration style, rendering technique, motif family, and color palette. Refine 20% of motif outlines, inner petals, leaf vein detailing, and secondary accents while keeping primary motif placement intact.",
  },
  {
    value: 30,
    title: "30% Change",
    description: "Motif & layout refresh",
    editMode: "redesign",
    changeStrength: 0.6,
    referenceStrength: 0.5,
    promptStrength: 0.85,
    instruction:
      "Apply 30% distinct pattern variation! Match the artistic rendering style, color harmony, and motif family of the reference image. Noticeably refresh 30% of main motif shapes, floral petal curvatures, stem paths, leaf placements, and background accent distribution to create a clearly refreshed, elegant textile pattern.",
  },
  {
    value: 50,
    title: "50% Change",
    description: "Shape, placement & new elements",
    editMode: "redesign",
    changeStrength: 0.85,
    referenceStrength: 0.25,
    promptStrength: 0.95,
    instruction:
      "Apply 50% dramatic pattern redesign! Match the core artistic rendering technique and color harmony of the reference image. Visibly transform the entire pattern composition: alter motif shapes, change motif scale, rearrange motif positions across the canvas, alter vine/branch paths, and introduce new matching supporting flowers, leaves, foliage, and decorative filler details in the exact same art style. Create a fresh, rich, distinct new pattern variation.",
  },
];

const outputGuardrails =
  "Output requirements: flat print-ready textile artwork only, full-canvas edge-to-edge pattern tile, preserve source flow and repeat rhythm, no product mockup, no scarf, no cloth folds, no photographed fabric texture, no white border, no frame, no text, no logo, no watermark, no distorted motifs.";

const buildPresetPrompt = (
  preset: PatternPromptPreset,
  changeProfile: ChangeStrengthOption
) => {
  const basePrompt = preset.id === "auto" || !preset.prompt ? UNIVERSAL_BASE_PROMPT : preset.prompt;
  return `${basePrompt}\n\n${changeProfile.instruction}\n\n${outputGuardrails}`;
};

export default function GeminiImageToImage() {
  const location = useLocation();
  const isAiColorMatching = location.pathname === "/ai-studio/ai-color-matching";
  const pageTitle = isAiColorMatching ? "AI Color Matching" : "Pattern Maker";
  const pageIntro = isAiColorMatching
    ? "Upload a source image, write the prompt, choose the aspect ratio, and tune the edit mode for studio color-matching workflows."
    : "Upload a source image, write the prompt, choose the aspect ratio, and create refined pattern-maker variations.";

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState(1);
  const [aspectRatio, setAspectRatio] =
    useState<GeminiImageToImageAspectRatio>("auto");
  const [editMode, setEditMode] = useState<GeminiImageToImageMode>("auto");
  const [selectedProvider, setSelectedProvider] = useState<TextToImageProvider>("gemini");
  const [selectedPresetId, setSelectedPresetId] = useState(patternPromptPresets[0].id);
  const [changePercent, setChangePercent] = useState<ChangeStrengthOption["value"]>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [status, setStatus] = useState("Upload an image to get started.");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectedPreset =
    patternPromptPresets.find((preset) => preset.id === selectedPresetId) ||
    patternPromptPresets[0];
  const selectedChangeProfile =
    changeStrengthOptions.find((option) => option.value === changePercent) ||
    changeStrengthOptions[1];
  const modelOptions: { value: TextToImageProvider; label: string }[] = [
    { value: "gemini", label: "Gemini" },
    { value: "gpt", label: "GPT Image" },
  ];

  const applyPromptPreset = (
    preset: PatternPromptPreset = selectedPreset,
    changeProfile: ChangeStrengthOption = selectedChangeProfile
  ) => {
    setSelectedPresetId(preset.id);
    setChangePercent(changeProfile.value);
    setEditMode(changeProfile.editMode === "edit" ? preset.recommendedMode : changeProfile.editMode);
    setPrompt(buildPresetPrompt(preset, changeProfile));
    setGeneratedImages([]);
    setStatus(`${preset.title} preset applied with ${changeProfile.value}% change.`);
  };

  const handleChangeStrengthSelect = (option: ChangeStrengthOption) => {
    setChangePercent(option.value);
    setEditMode(option.editMode);
    setPrompt(buildPresetPrompt(selectedPreset, option));
  };

  const handleEnhancePrompt = async () => {
    if (isEnhancing) return;

    if (!prompt.trim()) {
      setStatus("Please enter a prompt first.");
      return;
    }

    try {
      setIsEnhancing(true);
      setStatus("Enhancing prompt...");
      const result = await enhancePrompt(prompt, file ?? undefined, "");
      setPrompt(result.enhanced_prompt);
      setStatus("Prompt enhanced.");
    } catch (error) {
      setStatus(getAiErrorMessage(error, "Prompt enhancement failed."));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;

    if (!file) {
      setStatus("Please upload an image first.");
      return;
    }

    if (!prompt.trim()) {
      setStatus("Please enter a prompt first.");
      return;
    }

    try {
      setIsGenerating(true);
      setStatus("Generating image variations...");

      const effectiveMode =
        changePercent === 50 || changePercent === 30
          ? "redesign"
          : editMode;

      const result = await generateGeminiImgToImg({
        file,
        prompt,
        provider: selectedProvider,
        numImages,
        aspectRatio,
        mode: effectiveMode,
        editType: selectedPreset.editType,
        changeStrength: selectedChangeProfile.changeStrength,
        referenceStrength: selectedChangeProfile.referenceStrength,
        promptStrength: selectedChangeProfile.promptStrength,
        variationType: selectedPreset.id,
        outputIntent: "flat print-ready textile pattern variation",
        qualityPreset: "clean commercial textile artwork",
        preserve:
          changePercent === 50
            ? "background color mood"
            : changePercent === 30
            ? "color mood, background ground"
            : "background ground color, general pattern theme",
        motifLock:
          changePercent === 50
            ? "allow 50% strong redesign of motif shapes, motif placement, and addition of new supporting elements"
            : changePercent === 30
            ? "allow 30% distinct motif shape redesign and placement adjustment"
            : "allow 20% visible motif shape and curve variation",
      });

      setGeneratedImages(result.images);
      const providerLabel = result.providerFallbackUsed
        ? ` using ${formatProviderLabel(result.provider || result.fallbackProvider)} fallback`
        : "";

      setStatus(
        result.images.length
          ? `Generated ${result.images.length} image${result.images.length > 1 ? "s" : ""}${providerLabel}.`
          : "Generation finished, but no images were returned."
      );
    } catch (error) {
      setStatus(getAiErrorMessage(error, "Generation failed."));
    } finally {
      setIsGenerating(false);
    }
  };

  const isAllowedUpload = (incoming: File) => {
    const normalizedName = incoming.name.toLowerCase();
    return (
      ALLOWED_GEMINI_IMAGE_TYPES.includes(incoming.type) ||
      ALLOWED_GEMINI_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
    );
  };

  const validateIncomingUpload = (incoming: File) => {
    if (!isAllowedUpload(incoming)) {
      return "Please upload a PNG, JPG, JPEG, or WEBP image.";
    }

    if (incoming.size > MAX_GEMINI_IMAGE_UPLOAD_BYTES) {
      return "Please upload an image smaller than 120 MB.";
    }

    return "";
  };

  const changeNumImages = (delta: number) => {
    setNumImages((current) => Math.max(1, Math.min(4, current + delta)));
  };

  const handleDownload = async (url: string, filename: string, index?: number) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = getPatternMakerDownloadName(filename, index);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="relative overflow-hidden bg-[#111315] pb-8 text-[#F5F7FA]">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeSlide}
            src={slideshowImages[activeSlide]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.35, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#111315]/85 to-[#111315]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-8 p-5 md:p-7 xl:p-8">
        <header className="flex flex-col gap-4 border-b border-[#2B3138]/60 pb-6 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2B3138] bg-[#1C2025] px-3 py-1 text-xs font-semibold text-[#A1A8B3]">
              <Sparkles className="h-3.5 w-3.5 text-[#E11D2E]" />
              {isAiColorMatching ? "RDC AI Studio / Color" : "RDC AI Studio / Generate"}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              {pageTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#A1A8B3]">
              {pageIntro}
            </p>
            <div className="mt-3">
              <AiCreditCost credits={8} label="Deduction" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((current) => !current)}
              className="rounded-xl border border-[#2B3138] bg-[#20242A] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#A1A8B3] transition hover:border-[#E11D2E]/40 hover:text-white"
            >
              {isPlaying ? "Pause motion" : "Play motion"}
            </button>
            <Link
              to="/ai-studio"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#2B3138] bg-[#20242A] px-5 text-sm font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31]"
            >
              <span className="text-[#E11D2E]">←</span>
              Dashboard
            </Link>
          </div>
        </header>

        {/* Main Horizontal Generator Card */}
        <div className="rounded-[24px] border border-[#2B3138] bg-[#181B1F]/92 p-5 shadow-2xl backdrop-blur-xl md:p-6 mb-6">
          {/* Side-by-Side Reference & Prompt Columns */}
          <div className="grid grid-cols-1 md:grid-cols-[440px_1fr] gap-8 mb-6">
            {/* Left Side: Upload zone */}
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A1A8B3]">
                Source Design / Reference Image
              </span>
              <div
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
                  const incoming = e.dataTransfer.files?.[0];
                  if (incoming) {
                    const uploadError = validateIncomingUpload(incoming);
                    if (uploadError) {
                      setStatus(uploadError);
                      return;
                    }

                    setFile(incoming);
                    setGeneratedImages([]);
                    setStatus("Reference image loaded.");
                  }
                }}
                className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 ${
                  isDragOver
                    ? "border-[#E11D2E] bg-[#E11D2E]/5"
                    : "border-[#2B3138] bg-[#111315]/30 hover:border-[#E11D2E]/40 hover:bg-[#111315]/50"
                } w-full max-w-[440px] aspect-square`}
              >
                {previewUrl ? (
                  <div className="absolute inset-0 h-full w-full flex items-center justify-center overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/50">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="rounded-full bg-[#E11D2E] p-2.5 text-white hover:bg-[#ff3347] transition transform scale-90 group-hover:scale-100 duration-300 shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[#A1A8B3] group-hover:text-[#E11D2E] transition-colors" />
                    <div className="text-center px-4">
                      <p className="text-xs font-bold text-[#A1A8B3] group-hover:text-white transition-colors">
                        Drag & drop image here or <span className="text-[#E11D2E]">browse</span>
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#6B7280]">Supports PNG, JPG, WEBP - Max 120MB</p>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const incoming = e.target.files?.[0];
                    if (incoming) {
                      const uploadError = validateIncomingUpload(incoming);
                      if (uploadError) {
                        setStatus(uploadError);
                        e.target.value = "";
                        return;
                      }

                      setFile(incoming);
                      setGeneratedImages([]);
                      setStatus("Reference image loaded.");
                    }
                  }}
                />
              </div>
            </div>

            {/* Right Side: Prompt Description */}
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A1A8B3]">
                Prompt Description
              </span>
              <div className="relative w-full h-[440px]">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g. "Replace flowers with hibiscus while keeping layout same"'
                  className="no-scrollbar h-full w-full resize-none rounded-xl border border-[#2B3138] bg-[#111315]/60 p-4 pb-12 text-sm text-[#F5F7FA] placeholder:text-[#6B7280] transition-all focus:border-[#E11D2E]/50 focus:bg-[#111315]/80 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="absolute bottom-3 right-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E11D2E]/40 bg-[#E11D2E]/15 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffb3bb] shadow-lg shadow-black/20 transition hover:border-[#E11D2E]/70 hover:bg-[#E11D2E]/25 disabled:cursor-not-allowed disabled:border-[#2B3138] disabled:bg-[#20242A] disabled:text-[#6B7280]"
                >
                  {isEnhancing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  <span>{isEnhancing ? "Enhancing..." : "Enhance"}</span>
                </button>
              </div>
            </div>
          </div>

          {!isAiColorMatching && (
            <div className="mb-6 space-y-6">
              <div className="rounded-2xl border border-[#2B3138] bg-[#111315]/55 p-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#E11D2E]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A8B3]">
                      Designer Flow
                    </p>
                  </div>
                  <p className="text-xs text-[#A1A8B3]">
                    For best results, generate controlled variations before trying heavy redesigns.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {patternWorkflowSteps.map((step) => (
                    <div
                      key={step.title}
                      className="rounded-xl border border-[#2B3138] bg-[#0F1114] p-3"
                    >
                      <div className="text-sm font-semibold text-white">{step.title}</div>
                      <div className="mt-1 text-xs leading-5 text-[#A1A8B3]">
                        {step.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#2B3138] bg-[#111315]/55 p-5">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-[#E11D2E]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A8B3]">
                      Variation Change Strength
                    </p>
                  </div>
                  <p className="text-xs text-[#A1A8B3]">
                    Click 20%, 30%, or 50% to auto-change design variations
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {changeStrengthOptions.map((option) => {
                    const active = changePercent === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChangeStrengthSelect(option)}
                        className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-300 ${
                          active
                            ? "border-[#E11D2E] bg-[#E11D2E]/15 shadow-lg shadow-[#E11D2E]/10"
                            : "border-[#2B3138] bg-[#0F1114] hover:border-[#E11D2E]/40 hover:bg-[#111315]/80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-bold text-white">{option.title}</span>
                            {active && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#E11D2E] animate-pulse" />
                            )}
                          </div>
                          <p className="mt-1 text-xs font-semibold text-[#E11D2E]">
                            {option.description}
                          </p>
                        </div>
                        <p className="mt-4 text-xs leading-relaxed text-[#A1A8B3]">
                          {option.value === 20 && "Preserves exact motif placement while refining linework & fine details."}
                          {option.value === 30 && "Refreshes motif shapes, curves & placements in matching art style."}
                          {option.value === 50 && "Redesigns layout, motif shapes, placements & adds new matching elements."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Middle Row: Aspect Ratio & Num Images */}
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <FieldCard title="Model" icon={<Sparkles className="h-4 w-4 text-[#E11D2E]" />}>
              <SelectField
                value={selectedProvider}
                onChange={(value) => setSelectedProvider(value as TextToImageProvider)}
                options={modelOptions}
              />
            </FieldCard>

            <FieldCard title="Aspect Ratio" icon={<Maximize className="h-4 w-4 text-[#E11D2E]" />}>
              <SelectField
                value={aspectRatio}
                onChange={(value) => setAspectRatio(value as GeminiImageToImageAspectRatio)}
                options={GEMINI_IMAGE_TO_IMAGE_ASPECT_RATIOS.map((ratio) => ({
                  value: ratio,
                  label: aspectRatioLabels[ratio],
                }))}
              />
            </FieldCard>

            <FieldCard title="Num Images" icon={<ImageIcon className="h-4 w-4 text-[#E11D2E]" />}>
              <div className="flex items-center gap-2 rounded-xl border border-[#2B3138] bg-[#0F1114] p-2.5">
                <button
                  type="button"
                  onClick={() => changeNumImages(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2B3138] bg-[#181B1F] text-[#F5F7FA] transition hover:border-[#E11D2E]/40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex-1 text-center text-sm font-semibold text-white">
                  {numImages}
                </div>
                <button
                  type="button"
                  onClick={() => changeNumImages(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2B3138] bg-[#181F] text-[#F5F7FA] transition hover:border-[#E11D2E]/40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </FieldCard>
          </div>

          {/* Bottom Section: Edit Mode preset buttons */}
          <div className="rounded-2xl border border-[#2B3138] bg-[#111315]/55 p-4 mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[#E11D2E]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A8B3]">
                Edit Mode
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {editModeOptions.map((option) => {
                const active = editMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEditMode(option.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#E11D2E]/50 bg-[#E11D2E]/12"
                        : "border-[#2B3138] bg-[#0F1114] hover:border-[#E11D2E]/35"
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{option.title}</div>
                    <div className="mt-1 text-xs leading-5 text-[#A1A8B3]">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions panel */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#2B3138] bg-[#111315]/55 p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[#A1A8B3]">{status}</p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E11D2E] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff3347] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {/* Main content below the slideshow (Results, Descriptions, FAQs) */}
      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-8 p-5 md:p-7 xl:p-8 pt-0">
        {/* Results Area */}
        {(previewUrl || generatedImages.length > 0 || isGenerating) && (
          <div className="mt-8 border-t border-[#2B3138]/40 pt-8">
            <h3 className="text-lg font-bold text-white tracking-wider uppercase mb-4 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#E11D2E]" />
              Workspace Outputs & Previews
            </h3>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Card 1: Original reference preview */}
              <div className="overflow-hidden rounded-2xl border border-[#2B3138] bg-[#181B1F]">
                <div className="flex items-center justify-between border-b border-[#2B3138]/60 px-4 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Original</span>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Reference Design</span>
                </div>
                <div className="relative h-72 w-full overflow-hidden bg-black/40">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Reference preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-8 text-center text-sm text-[#6B7280]">
                      No reference image uploaded.
                    </div>
                  )}
                </div>
              </div>

              {/* Subsequent cards: Generated variations */}
              {isGenerating ? (
                <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-[#2B3138] bg-[#181B1F]/50 col-span-3">
                  <Loader2 className="h-10 w-10 animate-spin text-[#E11D2E] mb-4" />
                  <p className="text-sm font-bold uppercase tracking-wider text-white">Generating variations...</p>
                  <p className="mt-1 text-xs text-[#A1A8B3]">Creating your textile design variants</p>
                </div>
              ) : (
                generatedImages.map((image, index) => {
                  const resolvedUrl = image.url;
                  return (
                    <div
                      key={image.id}
                      className="group relative overflow-hidden rounded-2xl border border-[#2B3138] bg-[#181B1F] transition-all duration-300 hover:border-[#E11D2E]/50"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedImage(resolvedUrl)}
                        className="block w-full text-left"
                      >
                        <div className="relative h-72 w-full overflow-hidden bg-black/40">
                          <img
                            src={resolvedUrl}
                            alt={`Generated output ${index + 1}`}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                          />
                        </div>
                      </button>
                      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#2B3138]/60">
                        <div>
                          <p className="text-sm font-semibold text-white">Variation {index + 1}</p>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#6B7280]">
                            {getPatternMakerDownloadName(image.filename, index)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDownload(resolvedUrl, image.filename, index)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#2B3138] bg-[#20242A] px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A1A8B3] transition hover:border-[#E11D2E]/40 hover:text-white"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

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
            AI Pattern Maker: FAQs
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

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 24 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#111315] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/70 p-2 text-white transition hover:bg-[#E11D2E]"
              >
                <X className="h-4 w-4" />
              </button>
              <img src={selectedImage} alt="Expanded output preview" className="max-h-[80vh] w-full object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatProviderLabel(provider?: string | null) {
  const normalizedProvider = (provider || "").trim().toLowerCase();
  if (normalizedProvider === "openai" || normalizedProvider === "gpt") return "GPT";
  if (normalizedProvider === "gemini") return "Gemini";
  return "alternate";
}


function FieldCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#2B3138] bg-[#111315]/55 p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A8B3]">{title}</p>
      </div>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-[#2B3138] bg-[#0F1114] px-3 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-[#E11D2E]/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
    </div>
  );
}
