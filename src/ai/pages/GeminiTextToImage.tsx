import { useEffect, useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  enhancePrompt,
  generateGeminiTextToImage,
  getAIImageUrl,
  getAiErrorMessage,
  GEMINI_GENERATION_ASPECT_RATIOS,
  type GenerateResponse,
  type GeminiGenerationAspectRatio,
} from "@/api/aiApi";
import AiCreditEstimate from "@/ai/components/AiCreditEstimate";

import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";

import gptImage2Showcase from "@/assets/gpt-image2-showcase.png";
import flamingoShowcase from "@/assets/flamingo-showcase.png";
import colorfulCharacterShowcase from "@/assets/colorful-character-showcase.png";

type GeneratedImage = GenerateResponse["images"][number];

const GEMINI_TEXT_TO_IMAGE_COST = 10;

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

export default function GeminiTextToImage() {
  const [userPrompt, setUserPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState("");
  const [numImages, setNumImages] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [, setRemainingCredits] = useState<number | null>(null);
  const [activeStyle, setActiveStyle] = useState("floral");
  const [aspectRatio, setAspectRatio] =
    useState<GeminiGenerationAspectRatio>("1:1");

  // Popover state
  const [activePopover, setActivePopover] = useState<"settings" | "style" | "aspect" | null>(null);

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
    <div className="bg-[#111315] text-[#F5F7FA] relative pb-6">
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
                AI Text to Image: Gemini Model
              </h1>
            </div>

            <Link
              to="/ai-studio"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#2B3138] bg-[#20242A] px-5 text-sm font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31] self-start sm:self-auto"
            >
              ← Dashboard
            </Link>
          </div>

          {/* Generator panel and slideshow slider */}
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            {/* Horizontal Settings Card */}
            <div className="flex-1 rounded-[24px] border border-[#2B3138]/30 bg-[#181B1F]/90 p-6 backdrop-blur-xl shadow-2xl relative z-30 flex flex-col justify-between min-h-[200px]">
              <div>
                {/* Prompt text area */}
                <div className="relative w-full mb-4">
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Describe exactly what you want to create and watch Gemini model bring it to life..."
                    className="no-scrollbar h-28 w-full resize-none rounded-xl border border-[#2B3138]/40 bg-[#111315]/60 p-4 pb-12 text-sm text-[#F5F7FA] placeholder:text-[#6B7280] transition-all focus:border-[#E11D2E]/50 focus:bg-[#111315]/80 focus:outline-none"
                  />

                  <div className="absolute bottom-3 right-3">
                    <button
                      onClick={handleEnhance}
                      disabled={isEnhancing || !userPrompt.trim()}
                      className="flex items-center gap-1.5 rounded-lg border border-[#E11D2E]/30 bg-[#E11D2E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9ba5] transition hover:bg-[#E11D2E]/20 disabled:opacity-30"
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

              {/* Bottom controls row */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#2B3138]/40 pt-5">
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Popover: Outputs */}
                  <div className={`relative ${activePopover === "settings" ? "z-50" : "z-10"}`}>
                    <button
                      onClick={() => setActivePopover(activePopover === "settings" ? null : "settings")}
                      className="flex items-center gap-2 rounded-xl border border-[#2B3138]/60 bg-[#20242A] px-4 py-2.5 text-xs font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31]"
                    >
                      <span>Outputs: {numImages}</span>
                      <ChevronDown className="h-4 w-4 text-[#A1A8B3]" />
                    </button>

                    <AnimatePresence>
                      {activePopover === "settings" && (
                        <>
                          <div
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={() => setActivePopover(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 z-40 mb-2 w-72 rounded-[20px] border border-[#2B3138] bg-[#1C2025] p-4 shadow-2xl space-y-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#A1A8B3]">
                                  Number of Outputs
                                </span>
                                <span className="text-sm font-bold text-[#E11D2E]">{numImages}/4</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setNumImages(Math.max(1, numImages - 1));
                                  }}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] transition hover:border-[#E11D2E] hover:text-white"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>

                                <div className="flex h-9 flex-1 items-center justify-center rounded-xl border border-[#2B3138] bg-[#111315]">
                                  <span className="text-sm font-bold text-white">{numImages}</span>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setNumImages(Math.min(4, numImages + 1));
                                  }}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] transition hover:border-[#E11D2E] hover:text-white"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="border-t border-[#2B3138] pt-3">
                              <AiCreditEstimate
                                breakdown={`${numImages} Outputs × ${GEMINI_TEXT_TO_IMAGE_COST} Credits`}
                                totalCredits={numImages * GEMINI_TEXT_TO_IMAGE_COST}
                              />
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Popover: Style */}
                  <div className={`relative ${activePopover === "style" ? "z-50" : "z-10"}`}>
                    <button
                      onClick={() => setActivePopover(activePopover === "style" ? null : "style")}
                      className="flex items-center gap-2 rounded-xl border border-[#2B3138]/60 bg-[#20242A] px-4 py-2.5 text-xs font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31]"
                    >
                      <span>Style: {styles.find((s) => s.id === activeStyle)?.label || activeStyle}</span>
                      <ChevronDown className="h-4 w-4 text-[#A1A8B3]" />
                    </button>

                    <AnimatePresence>
                      {activePopover === "style" && (
                        <>
                          <div
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={() => setActivePopover(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 z-40 mb-2 w-60 rounded-[20px] border border-[#2B3138] bg-[#1C2025] p-4 shadow-2xl space-y-2"
                          >
                            <p className="text-xs font-bold uppercase tracking-wider text-[#A1A8B3] mb-1">
                              Pattern Style
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {styles.map((style) => (
                                <button
                                  key={style.id}
                                  onClick={() => {
                                    setActiveStyle(style.id);
                                    setActivePopover(null);
                                  }}
                                  className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all duration-300 ${
                                    activeStyle === style.id
                                      ? "border-[#E11D2E] bg-[#E11D2E]/10 text-white shadow-[0_0_8px_rgba(225,29,46,0.2)]"
                                      : "border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] hover:border-white/20 hover:text-white"
                                  }`}
                                >
                                  {style.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Popover: Aspect Ratio */}
                  <div className={`relative ${activePopover === "aspect" ? "z-50" : "z-10"}`}>
                    <button
                      onClick={() => setActivePopover(activePopover === "aspect" ? null : "aspect")}
                      className="flex items-center gap-2 rounded-xl border border-[#2B3138]/60 bg-[#20242A] px-4 py-2.5 text-xs font-bold text-[#F5F7FA] transition hover:border-[#E11D2E]/50 hover:bg-[#252A31]"
                    >
                      <span>Aspect: {aspectRatio}</span>
                      <ChevronDown className="h-4 w-4 text-[#A1A8B3]" />
                    </button>

                    <AnimatePresence>
                      {activePopover === "aspect" && (
                        <>
                          <div
                            className="fixed inset-0 z-30 cursor-default"
                            onClick={() => setActivePopover(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 z-40 mb-2 w-52 rounded-[20px] border border-[#2B3138] bg-[#1C2025] p-4 shadow-2xl space-y-2"
                          >
                            <p className="text-xs font-bold uppercase tracking-wider text-[#A1A8B3] mb-1">
                              Aspect Ratio
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {GEMINI_GENERATION_ASPECT_RATIOS.map((ratio) => (
                                <button
                                  key={ratio}
                                  onClick={() => {
                                    setAspectRatio(ratio);
                                    setActivePopover(null);
                                  }}
                                  className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                                    aspectRatio === ratio
                                      ? "border-[#E11D2E] bg-[#E11D2E]/10 text-white shadow-[0_0_8px_rgba(225,29,46,0.2)]"
                                      : "border-[#2B3138] bg-[#181B1F] text-[#A1A8B3] hover:border-white/20 hover:text-gray-300"
                                  }`}
                                >
                                  {ratio}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                {/* Action button */}
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase tracking-wider text-[#A1A8B3]">Cost</p>
                    <p className="text-xs font-bold text-[#ff9ba5]">{numImages * GEMINI_TEXT_TO_IMAGE_COST} Credits</p>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 rounded-xl bg-[#E11D2E] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#FF3347] disabled:opacity-40 shadow-[0_4px_12px_rgba(225,29,46,0.3)] hover:shadow-[0_6px_20px_rgba(225,29,46,0.4)]"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>{isGenerating ? "GENERATING..." : "GENERATE DESIGN"}</span>
                  </button>
                </div>
              </div>

              {error && (
                <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Main content below the slideshow (Results & Marketing sections) */}
      <div className="relative z-10 mx-auto flex max-w-[1480px] flex-col gap-8 p-5 md:p-7 xl:p-8 pt-0">
        {/* Output Area */}
        <div className="mt-8 border-t border-[#2B3138]/40 pt-8">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 space-y-4"
              >
                <Loader2 className="h-10 w-10 animate-spin text-[#E11D2E]" />
                <div className="text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-white">
                    Generating...
                  </p>
                  <p className="mt-1 text-xs text-[#A1A8B3]">Creating your design</p>
                </div>
              </motion.div>
            ) : generatedImages.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden rounded-xl border border-[#2B3138] bg-[#181B1F] transition-all duration-300 hover:border-[#E11D2E]/50"
                  >
                    <button
                      onClick={() => setPreviewImage(getAIImageUrl(img.url))}
                      className="relative block aspect-square w-full cursor-pointer overflow-hidden bg-black"
                    >
                      <img
                        src={getAIImageUrl(img.url)}
                        alt="Generated"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/40" />

                      <span
                        className="absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white opacity-0 backdrop-blur-md transition-all group-hover:opacity-100"
                        title="Preview"
                      >
                        <Maximize className="h-5 w-5" />
                      </span>
                    </button>

                    <div className="space-y-3 border-t border-[#2B3138]/60 p-3">
                      <p className="text-xs font-bold text-[#F5F7FA] truncate">
                        {img.filename || `Design #${img.id}`}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleDownload(
                              getAIImageUrl(img.url),
                              img.filename || `design-${img.id}.png`
                            )
                          }
                          className="flex-1 rounded-lg border border-[#2B3138] bg-[#20242A] px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-[#A1A8B3] transition-all hover:border-[#E11D2E]/50 hover:bg-[#252A31] hover:text-[#F5F7FA]"
                          title="Download"
                        >
                          <Download className="h-3 w-3 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-8 text-center"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#2B3138] bg-[#181B1F]">
                  <Sparkles className="h-9 w-9 text-[#6B7280]" />
                </div>
                <h2 className="mt-5 text-xl font-bold tracking-tight text-white">
                  Gemini Text To Image Ready
                </h2>
                <p className="mt-2 max-w-sm text-sm text-[#A1A8B3]">
                  Build premium textile concepts directly from prompts without using the SDXL generate screen.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
            AI Text to Image: FAQs
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

      {/* Full-screen preview modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-full max-w-5xl overflow-hidden rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 z-10 text-white transition-colors hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>

              <img
                src={previewImage}
                alt="Preview"
                className="max-h-full max-w-full rounded-xl object-contain"
              />

              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() =>
                    handleDownload(previewImage, `design-${Date.now()}.png`)
                  }
                  className="flex items-center gap-2 rounded-lg bg-[#E11D2E] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#FF3347] shadow-[0_4px_12px_rgba(225,29,46,0.4)]"
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
