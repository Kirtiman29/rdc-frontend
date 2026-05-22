import React, { useEffect, useState } from "react";
import {
  Image,
  Sparkles,
  Wand2,
  Loader2,
  LayoutGrid,
  Zap,
  Palette,
  Download,
  X,
  Maximize,
  Plus,
  Minus,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  enhancePrompt,
  generateDesign,
  generateGeminiImageToImage,
  getAIImageUrl,
  getAiErrorMessage,
  upscaleImage,
  type GenerateResponse,
} from "@/api/aiApi";
import AiCreditEstimate from "@/ai/components/AiCreditEstimate";

type GeneratedImage = GenerateResponse["images"][number];
type GenerateEngine = "SDXL" | "GEMINI_IMAGE_TO_IMAGE";

const creditByEngine: Record<GenerateEngine, number> = {
  SDXL: 10,
  GEMINI_IMAGE_TO_IMAGE: 12,
};

type GeneratorPanelProps = {
  onGenerate: () => void;
  isGenerating: boolean;
  setFile: (file: File | null) => void;
  strength: number;
  setStrength: React.Dispatch<React.SetStateAction<number>>;
  activeStyle: string;
  setActiveStyle: React.Dispatch<React.SetStateAction<string>>;
  error: string;
  previewUrl: string | null;
  numImages: number;
  setNumImages: React.Dispatch<React.SetStateAction<number>>;
  userPrompt: string;
  setUserPrompt: React.Dispatch<React.SetStateAction<string>>;
  onEnhance: () => void;
  isEnhancing: boolean;
  engine: GenerateEngine;
  setEngine: React.Dispatch<React.SetStateAction<GenerateEngine>>;
  generationCreditCost: number;
};

function GeneratorPanel({
  onGenerate,
  isGenerating,
  setFile,
  strength,
  setStrength,
  activeStyle,
  setActiveStyle,
  error,
  previewUrl,
  numImages,
  setNumImages,
  userPrompt,
  setUserPrompt,
  onEnhance,
  isEnhancing,
  engine,
  setEngine,
  generationCreditCost,
}: GeneratorPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const styles = [
    { id: "floral", label: "Floral" },
    { id: "paisley", label: "Paisley" },
    { id: "abstract", label: "Abstract" },
  ];

  const isGeminiImageToImage = engine === "GEMINI_IMAGE_TO_IMAGE";

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            AI Engine
          </label>
          <div className="relative">
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as GenerateEngine)}
              className="appearance-none rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-3 pr-9 text-[11px] font-bold uppercase tracking-[0.18em] text-white outline-none transition-colors hover:border-white/20 focus:border-[#ff1a1a]/40"
            >
              <option value="SDXL" className="bg-[#0a0a0a]">
                SDXL
              </option>
              <option value="GEMINI_IMAGE_TO_IMAGE" className="bg-[#0a0a0a]">
                Gemini Img-Img
              </option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff1a1a]/30 bg-[#ff1a1a]/20 shadow-[0_0_15px_rgba(255,26,26,0.1)]">
            <Zap className="h-5 w-5 text-[#ff1a1a]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">
              {isGeminiImageToImage ? "Gemini Image To Image" : "Textile SDXL Pro"}
            </p>
            <p className="text-[10px] font-medium text-gray-500">
              {isGeminiImageToImage
                ? "Reference-led Gemini refinement with normalized output URLs"
                : "SDXL textile generation with optional reference image"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            Reference Image
          </label>
          <span className="text-[9px] font-medium text-gray-600">
            {isGeminiImageToImage ? "REQUIRED FOR GEMINI" : "OPTIONAL"}
          </span>
        </div>

        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ borderColor: "rgba(255, 26, 26, 0.4)" }}
          className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragOver ? "border-[#ff1a1a] bg-[#ff1a1a]/5" : "border-white/5"
          } ${previewUrl ? "aspect-[4/3] p-0" : "min-h-[180px] p-8"}`}
        >
          <div className="absolute inset-0 bg-[#ff1a1a]/0 transition-colors duration-500 group-hover:bg-[#ff1a1a]/5" />

          {previewUrl ? (
            <div className="absolute inset-0 h-full w-full">
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/60">
                <div className="rounded-full bg-white/10 p-4 opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 group-hover:opacity-100">
                  <Image className="h-6 w-6 text-white" />
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Change Image
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-500 group-hover:scale-110 group-hover:border-[#ff1a1a]/30">
                <Image className="h-5 w-5 text-gray-500 group-hover:text-[#ff1a1a]" />
              </div>
              <div className="relative z-10 text-center">
                <p className="text-xs font-bold text-gray-400 transition-colors group-hover:text-white">
                  Drop reference here
                </p>
                <p className="mt-1 text-[10px] text-gray-600">PNG, JPG up to 10MB</p>
              </div>
            </>
          )}

          <input
            type="file"
            className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </motion.div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
          Pattern Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setActiveStyle(style.id)}
              className={`rounded-xl border py-2.5 text-xs font-medium transition-all duration-300 ${
                activeStyle === style.id
                  ? "border-white bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  : "border-white/5 bg-transparent text-gray-500 hover:border-white/20 hover:text-gray-300"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
          Number of Outputs
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              setNumImages(Math.max(1, numImages - 1));
            }}
            className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-gray-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:border-[#ff1a1a]/50 hover:bg-white/5 hover:text-[#ff1a1a] active:scale-95"
          >
            <Minus className="h-5 w-5 transition-transform group-hover:scale-110" />
          </button>

          <div className="relative flex h-12 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black/50 shadow-inner">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 to-transparent" />
            <span className="relative z-10 text-xl font-black tracking-widest text-white">
              {numImages}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              setNumImages(Math.min(4, numImages + 1));
            }}
            className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-gray-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:border-[#ff1a1a]/50 hover:bg-white/5 hover:text-[#ff1a1a] active:scale-95"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            Prompt
          </label>
          <motion.button
            onClick={onEnhance}
            disabled={isEnhancing}
            whileHover={{ scale: 1.05, backgroundColor: "#ff1a1a", color: "#fff" }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 rounded-full border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff7a7a] transition-all disabled:opacity-50"
          >
            <Wand2 className="h-3 w-3" />
            {isEnhancing ? "Enhancing..." : "Enhance"}
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] tracking-[0.18em] text-white">
              2C
            </span>
          </motion.button>
        </div>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder={
            isGeminiImageToImage
              ? "Describe how Gemini should transform the reference image..."
              : "Describe the fabric texture, colors, and pattern details..."
          }
          className="no-scrollbar h-32 w-full resize-none rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-white placeholder:text-gray-700 transition-all focus:border-[#ff1a1a]/40 focus:bg-white/[0.04] focus:outline-none"
        />
      </div>

      {engine === "SDXL" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              Creative Strength
            </label>
            <span className="rounded border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 px-2 py-0.5 text-xs font-mono font-bold text-[#ff1a1a]">
              {strength.toFixed(2)}
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={strength}
              onChange={(e) => setStrength(parseFloat(e.target.value))}
              className="w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-white transition-all"
              style={{
                background: `linear-gradient(to right, #ff1a1a 0%, #ff1a1a ${
                  strength * 100
                }%, rgba(255,255,255,0.1) ${strength * 100}%, rgba(255,255,255,0.1) 100%)`,
                height: "4px",
              }}
            />
            <style
              dangerouslySetInnerHTML={{
                __html: `
                input[type=range]::-webkit-slider-thumb {
                  appearance: none; height: 14px; width: 14px; border-radius: 50%;
                  background: #ffffff; cursor: pointer; border: 2px solid #ff1a1a;
                  box-shadow: 0 0 10px rgba(255, 26, 26, 0.5); transition: all 0.2s ease;
                }
              `,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#ff1a1a]/15 bg-[#ff1a1a]/5 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-300">
          Gemini image-to-image uses the dedicated `/api/ai/use` flow with a default `1:1`
          aspect ratio on this screen.
        </div>
      )}

      <div className="space-y-3">
        <AiCreditEstimate
          breakdown={`${numImages} Outputs x ${generationCreditCost} Credits`}
          totalCredits={numImages * generationCreditCost}
        />
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="group relative w-full overflow-hidden rounded-2xl bg-[#ff1a1a] py-4 font-bold tracking-wider text-white transition-all hover:shadow-[0_8px_30px_rgba(255,26,26,0.3)] disabled:opacity-40 disabled:hover:shadow-none"
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            {isGenerating ? "PROCESSING..." : "GENERATE DESIGN"}
          </div>
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default function Generate() {
  const [file, setFile] = useState<File | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [manualPrompt, setManualPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [numImages, setNumImages] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [, setRemainingCredits] = useState<number | null>(null);
  const [strength, setStrength] = useState(0.75);
  const [activeStyle, setActiveStyle] = useState("floral");
  const [engine, setEngine] = useState<GenerateEngine>("SDXL");

  const generationCreditCost = creditByEngine[engine];

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (downloadError) {
      console.error("Download failed:", downloadError);
    }
  };

  const [upscalingId, setUpscalingId] = useState<number | null>(null);

  const handleQuickUpscale = async (
    e: React.MouseEvent,
    imgUrl: string,
    imgId: number
  ) => {
    e.stopPropagation();
    if (upscalingId) return;

    try {
      setUpscalingId(imgId);
      const response = await fetch(getAIImageUrl(imgUrl));
      const blob = await response.blob();
      const sourceFile = new File([blob], `generated-${imgId}.png`, {
        type: blob.type,
      });

      const result = await upscaleImage(sourceFile, "smart");
      setRemainingCredits(result.remainingCredits ?? null);

      if (result.image) {
        const upscaledResponse = await fetch(getAIImageUrl(result.image));
        const upscaledBlob = await upscaledResponse.blob();
        const downloadUrl = URL.createObjectURL(upscaledBlob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `upscaled-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (upscaleError) {
      console.error("Quick upscale failed:", upscaleError);
      alert("Upscale failed. Please try again.");
    } finally {
      setUpscalingId(null);
    }
  };

  const openPreview = (url: string) => {
    setPreviewImage(url);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  const handleEnhance = async () => {
    if (!userPrompt.trim()) {
      alert("Enter prompt first");
      return;
    }

    try {
      setIsEnhancing(true);
      setError("");

      const result = await enhancePrompt(userPrompt, file || undefined, activeStyle);
      setUserPrompt(result.enhanced_prompt);
      setRemainingCredits(result.remainingCredits ?? null);
    } catch (enhanceError) {
      console.error("Enhance failed", enhanceError);
      setError(getAiErrorMessage(enhanceError, "Prompt enhancement failed."));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;

    if (engine === "GEMINI_IMAGE_TO_IMAGE" && !file) {
      alert("Please upload a reference image for Gemini image to image");
      return;
    }

    if (engine === "SDXL" && !file && !userPrompt.trim()) {
      alert("Please add a prompt or upload a reference image");
      return;
    }

    try {
      setIsGenerating(true);
      setError("");

      const result =
        engine === "GEMINI_IMAGE_TO_IMAGE"
          ? await generateGeminiImageToImage({
              file: file!,
              prompt: userPrompt,
              style: activeStyle,
              numImages,
            })
          : await (() => {
              const formData = new FormData();
              formData.append("strength", strength.toString());
              formData.append("style", activeStyle);
              formData.append("num_images", numImages.toString());
              formData.append("guidance_scale", "10");
              formData.append("user_prompt", userPrompt);
              formData.append("manual_prompt", manualPrompt || userPrompt);

              if (file) {
                formData.append("file", file);
              }

              return generateDesign(formData);
            })();

      setGeneratedImages(result.images);
      setRemainingCredits(result.remainingCredits ?? null);

      if (result.images.length < numImages) {
        setError(
          `Requested ${numImages} outputs, but the backend returned ${result.images.length}. The missing outputs are not present in /api/ai/use response.`
        );
      }
    } catch (generationError) {
      console.error("Generation failed:", generationError);
      setError(getAiErrorMessage(generationError, "Generation failed."));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white">
      <div className="z-20 flex w-full shrink-0 flex-col border-r border-white/5 bg-[#0a0a0a] shadow-2xl lg:w-96 xl:w-[420px]">
        <div className="flex items-center justify-between border-b border-white/5 p-8">
          <div>
            <h1 className="text-xl font-black tracking-tighter">CREATE</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
              Studio Workspace
            </p>
          </div>
          <Palette className="h-5 w-5 text-gray-700" />
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                .no-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .no-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .no-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 26, 26, 0.3);
                  border-radius: 3px;
                }
                .no-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 26, 26, 0.5);
                }
              `,
            }}
          />
          <GeneratorPanel
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            setFile={setFile}
            strength={strength}
            setStrength={setStrength}
            activeStyle={activeStyle}
            setActiveStyle={setActiveStyle}
            error={error}
            previewUrl={previewUrl}
            numImages={numImages}
            setNumImages={setNumImages}
            userPrompt={userPrompt}
            setUserPrompt={setUserPrompt}
            onEnhance={handleEnhance}
            isEnhancing={isEnhancing}
            engine={engine}
            setEngine={setEngine}
            generationCreditCost={generationCreditCost}
          />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col bg-[#050505]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,26,26,0.03)_0%,_transparent_100%)]" />

        <div className="flex-1 overflow-y-auto p-12">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center space-y-8"
              >
                <Loader2 className="h-12 w-12 animate-spin text-[#ff1a1a]" />
                <p className="animate-pulse text-sm font-bold uppercase tracking-widest text-white">
                  Generating...
                </p>
              </motion.div>
            ) : generatedImages.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2"
              >
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10"
                  >
                    <img
                      src={getAIImageUrl(img.url)}
                      alt="AI Generation"
                      className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onClick={() => openPreview(getAIImageUrl(img.url))}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/40" />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(getAIImageUrl(img.url));
                      }}
                      className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white opacity-0 backdrop-blur-md transition-all hover:scale-110 hover:bg-white/20 group-hover:opacity-100"
                      title="Preview Full Image"
                    >
                      <Maximize className="h-6 w-6 outline-none" />
                    </button>

                    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
                      <button
                        onClick={(e) => handleQuickUpscale(e, img.url, img.id)}
                        disabled={upscalingId === img.id}
                        className="flex h-[42px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/50 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all hover:scale-105 hover:border-[#ff1a1a]/50 hover:bg-[#ff1a1a]/80 disabled:pointer-events-none disabled:opacity-50"
                        title="Upscale & Download"
                      >
                        {upscalingId === img.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin outline-none" />
                            <span>Upscaling...</span>
                          </>
                        ) : (
                          <span>Upscale · 20C</span>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(
                            getAIImageUrl(img.url),
                            img.filename || `generated-${img.id}.png`
                          );
                        }}
                        className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/80"
                        title="Download Original Image"
                      >
                        <Download className="h-4 w-4 outline-none" />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex h-full flex-col items-center justify-center space-y-6 text-center"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-[40px] border border-white/5 bg-white/[0.02] group">
                  <LayoutGrid className="h-10 w-10 text-gray-700 transition-colors group-hover:text-[#ff1a1a]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">System Idle</h2>
                  <p className="max-w-[280px] text-sm text-gray-500">
                    Ready to transform your prompts into high-fidelity textile designs.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-h-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closePreview}
                className="absolute -top-12 right-0 text-white transition-colors hover:text-gray-300"
              >
                <X className="h-8 w-8" />
              </button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() =>
                    handleDownload(previewImage, `generated-${Date.now()}.png`)
                  }
                  className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
