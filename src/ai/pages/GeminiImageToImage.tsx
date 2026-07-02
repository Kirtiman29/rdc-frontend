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
import { Link } from "react-router-dom";
import {
  GEMINI_IMAGE_TO_IMAGE_ASPECT_RATIOS,
  generateGeminiImgToImg,
  getAiErrorMessage,
  type GenerateResponse,
  type GeminiImageToImageAspectRatio,
  type GeminiImageToImageMode,
} from "@/api/aiApi";

import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";

type GeneratedImage = GenerateResponse["images"][number];

const slideshowImages = [pattern1, pattern2, pattern3, pattern4];

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

const editModeOptions: Array<{
  value: GeminiImageToImageMode;
  title: string;
  description: string;
}> = [
  { value: "auto", title: "Auto", description: "Chooses the safest mode automatically" },
  { value: "edit", title: "Edit", description: "Changes only the requested parts" },
  { value: "redesign", title: "Redesign", description: "Creates a new variation of the design" },
];

export default function GeminiImageToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState(1);
  const [aspectRatio, setAspectRatio] =
    useState<GeminiImageToImageAspectRatio>("auto");
  const [editMode, setEditMode] = useState<GeminiImageToImageMode>("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("Upload an image to get started.");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

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

      const result = await generateGeminiImgToImg({
        file,
        prompt,
        numImages,
        aspectRatio,
        mode: editMode,
      });

      setGeneratedImages(result.images);
      setStatus(
        result.images.length
          ? `Generated ${result.images.length} image${result.images.length > 1 ? "s" : ""}.`
          : "Generation finished, but no images were returned."
      );
    } catch (error) {
      setStatus(getAiErrorMessage(error, "Generation failed."));
    } finally {
      setIsGenerating(false);
    }
  };

  const changeNumImages = (delta: number) => {
    setNumImages((current) => Math.max(1, Math.min(4, current + delta)));
  };

  const handleDownload = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
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
              RDC AI Studio
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Gemini Image to Image
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#A1A8B3]">
              Upload a source image, write the prompt, choose the aspect ratio,
              and pick the edit mode.
            </p>
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

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-[#2B3138] bg-[#181B1F]/92 p-5 shadow-2xl backdrop-blur-xl md:p-6">
            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
              <UploadPanel
                previewUrl={previewUrl}
                isDragOver={isDragOver}
                onSelect={(incoming) => {
                  setFile(incoming);
                  if (incoming) {
                    setGeneratedImages([]);
                    setStatus("Reference image loaded.");
                  }
                }}
                onDragOver={() => setIsDragOver(true)}
                onDragLeave={() => setIsDragOver(false)}
                onClear={() => setFile(null)}
              />

              <div className="space-y-5">
                <div className="rounded-2xl border border-[#2B3138] bg-[#111315]/55 p-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-[#E11D2E]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A8B3]">
                      Prompt
                    </p>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder='e.g. "Replace flowers with hibiscus while keeping layout same"'
                    className="mt-3 h-36 w-full resize-none rounded-xl border border-[#2B3138] bg-[#0F1114] p-4 text-sm text-white placeholder:text-[#6B7280] outline-none transition focus:border-[#E11D2E]/50"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
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
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2B3138] bg-[#181B1F] text-[#F5F7FA] transition hover:border-[#E11D2E]/40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </FieldCard>
                </div>

                <div className="rounded-2xl border border-[#2B3138] bg-[#111315]/55 p-4">
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
          </div>

          <aside className="rounded-[24px] border border-[#2B3138] bg-[#181B1F]/92 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A1A8B3]">
              <ImageIcon className="h-4 w-4 text-[#E11D2E]" />
              Results
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[#2B3138] bg-[#111315]">
              {previewUrl ? (
                <img src={previewUrl} alt="Reference preview" className="h-72 w-full object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center px-8 text-center text-sm text-[#6B7280]">
                  Upload an image to begin.
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {generatedImages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#2B3138] bg-[#111315]/60 px-6 py-10 text-center text-sm text-[#6B7280]">
                  Generated outputs will appear here.
                </div>
              ) : (
                generatedImages.map((image, index) => {
                  const resolvedUrl = image.url;
                  return (
                    <div
                      key={image.id}
                      className="overflow-hidden rounded-2xl border border-[#2B3138] bg-[#111315]"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedImage(resolvedUrl)}
                        className="block w-full text-left"
                      >
                        <img
                          src={resolvedUrl}
                          alt={`Generated output ${index + 1}`}
                          className="h-56 w-full object-cover transition duration-500 hover:scale-[1.02]"
                        />
                      </button>
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Variation {index + 1}</p>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#6B7280]">
                            {image.filename}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDownload(resolvedUrl, image.filename)}
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
          </aside>
        </section>
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

function UploadPanel({
  previewUrl,
  isDragOver,
  onSelect,
  onDragOver,
  onDragLeave,
  onClear,
}: {
  previewUrl: string | null;
  isDragOver: boolean;
  onSelect: (file: File | null) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#2B3138] bg-[#111315]/55 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A8B3]">
        Upload
      </p>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          onDragLeave();
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDragLeave();
          onSelect(e.dataTransfer.files?.[0] || null);
        }}
        className={`mt-3 flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-4 text-center transition ${
          isDragOver
            ? "border-[#E11D2E] bg-[#E11D2E]/8"
            : "border-[#d9c8b5] bg-[#f6efe6] text-[#201914]"
        }`}
      >
        {previewUrl ? (
          <div className="relative h-full w-full overflow-hidden rounded-[22px]">
            <img src={previewUrl} alt="Reference preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white transition hover:bg-[#E11D2E]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-[#8a6f56]" />
            <div>
              <p className="text-sm font-semibold">Drop textile image here</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#8a6f56]">
                PNG · JPG · JPEG · WEBP
              </p>
            </div>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onSelect(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
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
