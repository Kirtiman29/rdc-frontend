import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scan, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  Download, 
  Wand2, 
  X, 
  Maximize2,
  Fingerprint,
  Zap,
  ChevronRight,
  Move,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  generateSeamlessPattern,
  getAIImageUrl,
  getAiErrorMessage,
} from "../../api/aiApi";
import toast from "react-hot-toast";

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

export default function PatternFinder() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const mockEvent = {
        target: { files: e.dataTransfer.files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      onFileChange(mockEvent);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResultImage(null); // Reset previous result
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);
    try {
      const response = await generateSeamlessPattern(file);
      if (response.success && response.output_image) {
        setResultImage(getAIImageUrl(response.output_image));
        toast.success(response.message || "Pattern generated successfully");
      } else {
        toast.error("Failed to generate pattern");
      }
    } catch (error) {
      console.error(error);
      toast.error(getAiErrorMessage(error, "Error generating pattern"));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      const resp = await fetch(resultImage);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seamless-pattern-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Failed to download image");
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
                <Fingerprint className="h-3.5 w-3.5 text-[#E11D2E]" />
                RDC AI Studio
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                Pattern Extractor: Seamless Tile Generator
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
            <div className="flex-1 rounded-[24px] border border-[#2B3138]/30 bg-[#181B1F]/90 p-6 backdrop-blur-xl shadow-2xl relative z-30 flex flex-col justify-between min-h-[100px]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* Left info area */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5" /> Target Format
                    </span>
                    <span className="text-xs font-bold text-white uppercase">Seamless Tile (PNG)</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E11D2E]" /> AI Engine
                    </span>
                    <span className="text-xs font-bold text-white uppercase">Neural Extractor v1.0</span>
                  </div>
                </div>

                {/* Right action controls */}
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase tracking-wider text-[#A1A8B3]">Cost</p>
                    <p className="text-xs font-bold text-[#ff9ba5]">7 Credits</p>
                  </div>

                  <button
                    disabled={!preview || isExtracting}
                    onClick={handleExtract}
                    className="flex items-center gap-2 rounded-xl bg-[#E11D2E] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#FF3347] disabled:opacity-40 shadow-[0_4px_12px_rgba(225,29,46,0.3)] hover:shadow-[0_6px_20px_rgba(225,29,46,0.4)]"
                  >
                    {isExtracting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    <span>{isExtracting ? "EXTRACTING..." : resultImage ? "REGENERATE" : "GENERATE PATTERN"}</span>
                  </button>
                </div>

              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Main content below the slideshow (Results & Marketing sections) */}
      <div className="relative z-10 mx-auto flex max-w-[1480px] flex-col gap-8 p-5 md:p-7 xl:p-8 pt-0">
        
        {/* Workspace / Output Area */}
        <div className="mt-8 border-t border-[#2B3138]/40 pt-8 flex flex-col items-center justify-center">
          
          <div className="w-full max-w-5xl">
            {!preview ? (
              /* Awaiting Image Upload */
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center justify-center w-full aspect-[16/10] border border-dashed ${isDragOver ? "border-[#E11D2E] bg-white/[0.05]" : "border-[#2B3138]/60 bg-[#181B1F]/40"} rounded-[24px] hover:bg-[#181B1F]/60 hover:border-[#E11D2E]/50 transition-all cursor-pointer overflow-hidden`}
              >
                <div className="flex flex-col items-center gap-4 text-center p-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#1C2025] border border-[#2B3138] flex items-center justify-center group-hover:scale-110 group-hover:border-[#E11D2E]/50 transition-all">
                    <Upload className="w-8 h-8 text-[#A1A8B3] group-hover:text-[#E11D2E]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-white">
                      Upload Source Image or Garment Photo
                    </p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-bold">
                      Drag and drop here to isolate motifs and extract seamless tiles
                    </p>
                  </div>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={onFileChange} 
                  accept="image/*" 
                  ref={fileInputRef} 
                />
              </label>
            ) : (
              /* Image Selected: Side-by-side workspace */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Source Image Card */}
                <div className="relative aspect-square rounded-[24px] overflow-hidden border border-[#2B3138] bg-[#181B1F] flex items-center justify-center group">
                  <img src={preview} className="w-full h-full object-contain p-4 opacity-90" alt="Source" />
                  
                  {/* Extraction Scanner Line */}
                  <AnimatePresence>
                    {isExtracting && (
                      <motion.div 
                        key="scanner"
                        initial={{ top: "0%" }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-[#E11D2E] shadow-[0_0_20px_#E11D2E] z-20"
                      />
                    )}
                  </AnimatePresence>

                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-xl border border-[#2B3138] text-[10px] font-bold uppercase tracking-wider text-[#E11D2E] flex items-center gap-1.5">
                    <Scan className="w-3.5 h-3.5" /> Source Image
                  </div>

                  {!isExtracting && (
                    <button 
                      onClick={() => { setPreview(null); setFile(null); setResultImage(null); }} 
                      className="absolute bottom-4 right-4 p-3 bg-black/60 backdrop-blur-md hover:bg-[#E11D2E] rounded-full border border-white/10 transition-all z-30"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Extracted Pattern Result Card */}
                <div className="relative aspect-square rounded-[24px] overflow-hidden border border-[#2B3138] bg-[#181B1F] flex items-center justify-center">
                  
                  {!resultImage && !isExtracting && (
                    <div className="flex flex-col items-center text-gray-500 p-8 text-center">
                      <Scan className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-xs font-bold uppercase tracking-wider">Awaiting Analysis</p>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">Click Generate Pattern above to extract the print tile.</p>
                    </div>
                  )}

                  {isExtracting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="bg-[#181B1F] px-5 py-4 rounded-xl border border-[#2B3138] flex flex-col items-center gap-3"
                      >
                        <Wand2 className="w-6 h-6 text-[#E11D2E] animate-pulse" />
                        <span className="text-[#E11D2E] font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
                          Isolating Motif...
                        </span>
                      </motion.div>
                    </div>
                  )}

                  {resultImage && !isExtracting && (
                    <div className="w-full h-full relative group/result">
                      <img 
                        src={resultImage} 
                        className="w-full h-full object-contain p-4 transition-transform duration-500 ease-in-out group-hover/result:scale-105" 
                        alt="Extracted Pattern" 
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 transition-all duration-300 opacity-0 group-hover/result:opacity-100 flex items-center justify-center gap-4">
                        <button 
                          onClick={() => setIsFullscreen(true)}
                          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110"
                          title="Preview Fullscreen"
                        >
                          <Maximize2 className="w-5 h-5 text-white" />
                        </button>
                        <button 
                          onClick={handleDownload}
                          className="w-12 h-12 rounded-full bg-[#E11D2E] hover:bg-[#FF3347] flex items-center justify-center transition-all hover:scale-110 shadow-[0_4px_12px_rgba(225,29,46,0.4)]"
                          title="Download Image"
                        >
                          <Download className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${resultImage ? 'bg-[#E11D2E] text-white border-[#E11D2E]/50' : 'bg-[#1C2025] border-[#2B3138] text-gray-500'}`}>
                    Print-Ready Tile
                  </div>
                </div>

              </div>
            )}
          </div>
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
            AI Pattern Extractor: FAQs
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

      {/* FULLSCREEN PREVIEW MODAL */}
      <AnimatePresence>
        {isFullscreen && resultImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          >
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
              <div className="px-4 py-2 bg-black/50 border border-white/10 rounded-xl flex items-center gap-3">
                <Scan className="w-4 h-4 text-[#E11D2E]" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Full Design Preview</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleDownload}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-3 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Download Tile</span>
                </button>
                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="w-12 h-12 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="w-full h-full p-4 md:p-24 overflow-hidden relative">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="w-full h-full rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden bg-black flex items-center justify-center"
              >
                <img
                  src={resultImage}
                  alt="Full design preview"
                  className="max-w-full max-h-full object-contain"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
