import { useState } from "react";
import {
  Sparkles,
  Wand2,
  Loader2,
  Download,
  Maximize,
  X,
  Palette,
  Zap,
  Plus,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  enhancePrompt,
  generateGeminiTextToImage,
  getAIImageUrl,
  getAiErrorMessage,
  GEMINI_GENERATION_ASPECT_RATIOS,
  type GenerateResponse,
  type GeminiGenerationAspectRatio,
} from "@/api/aiApi";
import AiCreditCost from "@/ai/components/AiCreditCost";

type GeneratedImage = GenerateResponse["images"][number];

const GEMINI_TEXT_TO_IMAGE_COST = 10;

export default function GeminiTextToImage() {
  const [userPrompt, setUserPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState("");
  const [numImages, setNumImages] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [activeStyle, setActiveStyle] = useState("floral");
  const [aspectRatio, setAspectRatio] =
    useState<GeminiGenerationAspectRatio>("1:1");

  const styles = [
    { id: "floral", label: "Floral" },
    { id: "paisley", label: "Paisley" },
    { id: "abstract", label: "Abstract" },
  ];

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

  const handleEnhance = async () => {
    if (!userPrompt.trim()) {
      alert("Enter prompt first");
      return;
    }

    try {
      setIsEnhancing(true);
      setError("");

      const result = await enhancePrompt(userPrompt, undefined, activeStyle);
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
    if (!userPrompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    try {
      setIsGenerating(true);
      setError("");

      const result = await generateGeminiTextToImage({
        prompt: userPrompt,
        style: activeStyle,
        numImages,
        aspectRatio,
      });

      setGeneratedImages(result.images);
      setRemainingCredits(result.remainingCredits ?? null);
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
            <h1 className="text-xl font-black tracking-tighter">GEMINI TEXT</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
              Text To Image
            </p>
          </div>
          <Palette className="h-5 w-5 text-gray-700" />
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto p-6 space-y-8">
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
              `,
            }}
          />

          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              AI Engine
            </label>
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff1a1a]/30 bg-[#ff1a1a]/20 shadow-[0_0_15px_rgba(255,26,26,0.1)]">
                <Zap className="h-5 w-5 text-[#ff1a1a]" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-white">
                  Gemini Text To Image
                </p>
                <p className="text-[10px] font-medium text-gray-500">
                  Prompt-led generation through `/api/ai/use`
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Pattern Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setActiveStyle(style.id)}
                  className={`rounded-xl border py-2.5 text-xs font-medium transition-all ${
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
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Number of Outputs
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNumImages((value) => Math.max(1, value - 1))}
                className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-gray-400 transition-all hover:border-[#ff1a1a]/50 hover:bg-white/5 hover:text-[#ff1a1a]"
              >
                <Minus className="h-5 w-5 transition-transform group-hover:scale-110" />
              </button>
              <div className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-white/5 bg-black/50">
                <span className="text-xl font-black tracking-widest text-white">
                  {numImages}
                </span>
              </div>
              <button
                onClick={() => setNumImages((value) => Math.min(4, value + 1))}
                className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-gray-400 transition-all hover:border-[#ff1a1a]/50 hover:bg-white/5 hover:text-[#ff1a1a]"
              >
                <Plus className="h-5 w-5 transition-transform group-hover:scale-110" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Prompt
              </label>
              <div className="flex items-center gap-2">
                <AiCreditCost credits={2} label="Enhance" className="shrink-0" />
                <motion.button
                  onClick={handleEnhance}
                  disabled={isEnhancing}
                  whileHover={{ scale: 1.05, backgroundColor: "#ff1a1a", color: "#fff" }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 rounded-full border border-[#ff1a1a]/20 bg-[#ff1a1a]/10 px-3 py-1.5 text-[10px] font-bold text-[#ff1a1a] transition-all disabled:opacity-50"
                >
                  <Wand2 className="h-3 w-3" /> {isEnhancing ? "Enhancing..." : "Enhance"}
                </motion.button>
              </div>
            </div>

            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Describe the premium textile pattern you want Gemini to create..."
              className="no-scrollbar h-36 w-full resize-none rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-white placeholder:text-gray-700 transition-all focus:border-[#ff1a1a]/40 focus:bg-white/[0.04] focus:outline-none"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {GEMINI_GENERATION_ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`rounded-xl border py-2 text-[11px] font-bold transition-all ${
                    aspectRatio === ratio
                      ? "border-[#ff1a1a]/50 bg-[#ff1a1a] text-white shadow-[0_0_20px_rgba(255,26,26,0.2)]"
                      : "border-white/5 bg-transparent text-gray-500 hover:border-white/20 hover:text-gray-300"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between gap-3">
              <AiCreditCost
                credits={numImages * GEMINI_TEXT_TO_IMAGE_COST}
                label="This Run"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600">
                10 Credits Per Output
              </span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full rounded-2xl bg-[#ff1a1a] py-4 font-bold tracking-wider text-white transition-all hover:shadow-[0_8px_30px_rgba(255,26,26,0.3)] disabled:opacity-40"
            >
              <div className="flex items-center justify-center gap-2">
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                {isGenerating ? "PROCESSING..." : "GENERATE WITH GEMINI"}
              </div>
            </button>
          </div>

          {typeof remainingCredits === "number" && (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Credits Left: <span className="text-white">{remainingCredits}</span>
            </p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
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
                      alt="Gemini generation"
                      className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/40" />
                    <button
                      onClick={() => setPreviewImage(getAIImageUrl(img.url))}
                      className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white opacity-0 backdrop-blur-md transition-all hover:scale-110 hover:bg-white/20 group-hover:opacity-100"
                    >
                      <Maximize className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(
                          getAIImageUrl(img.url),
                          img.filename || `gemini-${img.id}.png`
                        )
                      }
                      className="absolute bottom-4 right-4 z-10 flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white opacity-0 backdrop-blur-md transition-all hover:scale-110 hover:bg-black/80 group-hover:opacity-100"
                    >
                      <Download className="h-4 w-4" />
                    </button>
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
                <div className="flex h-24 w-24 items-center justify-center rounded-[40px] border border-white/5 bg-white/[0.02]">
                  <Sparkles className="h-10 w-10 text-gray-700" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    Gemini Text To Image Ready
                  </h2>
                  <p className="max-w-[320px] text-sm text-gray-500">
                    Build premium textile concepts directly from prompts without using the
                    SDXL generate screen.
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
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-h-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 text-white transition-colors hover:text-gray-300"
              >
                <X className="h-8 w-8" />
              </button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
