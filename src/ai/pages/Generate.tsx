import React, { useState, useEffect } from "react";
import {
  Image, Sparkles, Wand2, Loader2, LayoutGrid,
  Zap, Palette, Download, X, Maximize, Plus, Minus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateDesign, getAIImageUrl, enhancePrompt, upscaleImage } from "@/api/aiApi"; // Assuming your api folder is in src

// --- SUB-COMPONENT: GENERATOR PANEL ---
// Refactored to receive props from parent (Step 2)
function GeneratorPanel({
  onGenerate,
  isGenerating,
  setFile,
  setPrompt,
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
  manualPrompt,
  onEnhance,
  isEnhancing,
  remainingCredits
}: any) {

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
    { id: "abstract", label: "Abstract" }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* 1. MODEL SECTION */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">AI Engine</label>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-[#ff1a1a]/20 flex items-center justify-center border border-[#ff1a1a]/30 shadow-[0_0_15px_rgba(255,26,26,0.1)]">
            <Zap className="w-5 h-5 text-[#ff1a1a]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">Textile SDXL Pro</p>
            <p className="text-[10px] text-gray-500 font-medium">v1.0 • Pattern Specialized</p>
          </div>
        </div>
      </div>

      {/* --- IMAGE DROP BOX SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Reference Image</label>
          <span className="text-[9px] text-gray-600 font-medium">OPTIONAL</span>
        </div>

        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ borderColor: "rgba(255, 26, 26, 0.4)" }}
          className={`relative group cursor-pointer border-2 border-dashed ${isDragOver ? "border-[#ff1a1a] bg-[#ff1a1a]/5" : "border-white/5"} rounded-2xl ${previewUrl ? 'aspect-[4/3] p-0' : 'min-h-[180px] p-8'} transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden`}
        >
          <div className="absolute inset-0 bg-[#ff1a1a]/0 group-hover:bg-[#ff1a1a]/5 transition-colors duration-500" />

          {previewUrl ? (
            // Preview Mode Container
            <div className="absolute inset-0 w-full h-full">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 flex flex-col items-center justify-center z-10">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/10 backdrop-blur-sm rounded-full p-4 hover:bg-white/20 hover:scale-110">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <p className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-white uppercase tracking-widest mt-3">Change Image</p>
              </div>
            </div>
          ) : (
            // Default Drop Area
            <>
              <div className="relative z-10 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:border-[#ff1a1a]/30 transition-all duration-500">
                <Image className="w-5 h-5 text-gray-500 group-hover:text-[#ff1a1a]" />
              </div>
              <div className="relative z-10 text-center">
                <p className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">Drop reference here</p>
                <p className="text-[10px] text-gray-600 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </>
          )}

          {/* Step 3: Fix File Upload */}
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer z-50 w-full h-full"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </motion.div>
      </div>

      {/* 2. STYLE SECTION */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Pattern Style</label>
        <div className="grid grid-cols-3 gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setActiveStyle(style.id)}
              className={`py-2.5 text-xs rounded-xl border transition-all duration-300 font-medium ${activeStyle === style.id
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                : "bg-transparent border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"
                }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* NUMBER OF OUTPUTS SECTION */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Number of Outputs</label>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.preventDefault(); setNumImages(Math.max(1, numImages - 1)); }}
            className="w-12 h-12 shrink-0 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-[#ff1a1a]/50 hover:text-[#ff1a1a] text-gray-400 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 group"
          >
            <Minus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex-1 h-12 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
            <span className="text-xl font-black text-white tracking-widest relative z-10">{numImages}</span>
          </div>

          <button
            onClick={(e) => { e.preventDefault(); setNumImages(Math.min(4, numImages + 1)); }}
            className="w-12 h-12 shrink-0 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-[#ff1a1a]/50 hover:text-[#ff1a1a] text-gray-400 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* 3. PROMPT SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Prompt</label>
          <motion.button
            onClick={onEnhance}
            disabled={isEnhancing}
            whileHover={{ scale: 1.05, backgroundColor: "#ff1a1a", color: "#fff" }}
            whileTap={{ scale: 0.95 }}
            className="text-[10px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff1a1a]/10 text-[#ff1a1a] border border-[#ff1a1a]/20 transition-all disabled:opacity-50"
          >
            <Wand2 className="w-3 h-3" /> {isEnhancing ? "Enhancing..." : "Enhance"}
          </motion.button>
        </div>
        {/* Step 4: Fix Prompt Input */}
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Describe the fabric texture, colors, and pattern details..."
          className="w-full h-32 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#ff1a1a]/40 focus:bg-white/[0.04] transition-all resize-none no-scrollbar"
        />

      </div>

      {/* 4. STRENGTH SLIDER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Creative Strength</label>
          <span className="text-xs font-mono font-bold text-[#ff1a1a] bg-[#ff1a1a]/10 px-2 py-0.5 rounded border border-[#ff1a1a]/20">
            {strength.toFixed(2)}
          </span>
        </div>

        <div className="relative flex items-center group">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={strength}
            onChange={(e) => setStrength(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white transition-all"
            style={{
              background: `linear-gradient(to right, #ff1a1a 0%, #ff1a1a ${strength * 100}%, rgba(255,255,255,0.1) ${strength * 100}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
          <style dangerouslySetInnerHTML={{
            __html: `
            input[type=range]::-webkit-slider-thumb {
              appearance: none; height: 14px; width: 14px; border-radius: 50%;
              background: #ffffff; cursor: pointer; border: 2px solid #ff1a1a;
              box-shadow: 0 0 10px rgba(255, 26, 26, 0.5); transition: all 0.2s ease;
            }
          `}} />
        </div>
      </div>

      {/* 6. GENERATE BUTTON */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full group relative overflow-hidden py-4 rounded-2xl bg-[#ff1a1a] text-white font-bold tracking-wider transition-all hover:shadow-[0_8px_30px_rgba(255,26,26,0.3)] disabled:opacity-40 disabled:hover:shadow-none"
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isGenerating ? "PROCESSING..." : "GENERATE DESIGN"}
        </div>
      </button>
      {typeof remainingCredits === "number" && (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
          Credits Left: <span className="text-white">{remainingCredits}</span>
        </p>
      )}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function Generate() {
  // Step 1: Add Required States
  const [file, setFile] = useState<File | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [manualPrompt, setManualPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [numImages, setNumImages] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);

  // Step 5: Move strength and style here
  const [strength, setStrength] = useState(0.75);
  const [activeStyle, setActiveStyle] = useState("floral");

  // Cleanup preview URL on unmount or when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // Handle image download
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Quick Upscale State
  const [upscalingId, setUpscalingId] = useState<number | null>(null);

  const handleQuickUpscale = async (e: React.MouseEvent, imgUrl: string, imgId: number) => {
    e.stopPropagation();
    if (upscalingId) return;

    try {
      setUpscalingId(imgId);
      // Fetch image and convert to File
      const response = await fetch(getAIImageUrl(imgUrl));
      const blob = await response.blob();
      const file = new File([blob], `generated-${imgId}.png`, { type: blob.type });

      // Call Upscale API
      const res = await upscaleImage(file, "normal", 1);
      setRemainingCredits(res.remainingCredits ?? null);

      // Download the result automatically
      if (res && res.image) {
        const upscaledResponse = await fetch(getAIImageUrl(res.image));
        const upscaledBlob = await upscaledResponse.blob();
        const downloadUrl = URL.createObjectURL(upscaledBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `upscaled-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (err) {
      console.error("Quick upscale failed:", err);
      alert("Upscale failed. Please try again.");
    } finally {
      setUpscalingId(null);
    }
  };

  // Handle image preview
  const openPreview = (url: string) => {
    setPreviewImage(url);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  // Handle prompt enhancement
  const handleEnhance = async () => {
    if (!userPrompt) {
      alert("Enter prompt first");
      return;
    }

    try {
      setIsEnhancing(true);

      const res = await enhancePrompt(userPrompt, file || undefined);

      console.log("Enhanced:", res);

      setUserPrompt(res.enhanced_prompt);
      setRemainingCredits(res.remainingCredits ?? null);

    } catch (err) {
      console.error("Enhance failed", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Step 6: REAL API CALL
  const handleGenerate = async () => {
    if (isGenerating) return;

    if (!file && !userPrompt.trim()) {
      alert("Please add a prompt or upload a reference image");
      return;
    }

    try {
      setIsGenerating(true);
      setError("");

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

      console.log("🚀 Sending request...");
      console.log("File:", file);
      console.log("User Prompt:", userPrompt);
      console.log("Manual Prompt:", manualPrompt);
      console.log("Strength:", strength);
      console.log("Style:", activeStyle);
      console.log("Num Images:", numImages);

      const res = await generateDesign(formData);

      console.log("✅ Response received:", res);

      setGeneratedImages(res.images);
      setRemainingCredits(res.remainingCredits ?? null);

    } catch (err: any) {
      console.error("❌ ERROR:", err);
      console.error("❌ ERROR RESPONSE:", err?.response);

      setError(err?.response?.data?.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
      {/* LEFT COLUMN: CONTROLS */}
      <div className="w-full lg:w-96 xl:w-[420px] shrink-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tighter">CREATE</h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">Studio Workspace</p>
          </div>
          <Palette className="w-5 h-5 text-gray-700" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <style dangerouslySetInnerHTML={{
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
          `}} />
          {/* Step 7: Pass Props to GeneratorPanel */}
          <GeneratorPanel
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            setFile={setFile}
            setPrompt={setUserPrompt}
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
            manualPrompt={manualPrompt}
            onEnhance={handleEnhance}
            isEnhancing={isEnhancing}
            remainingCredits={remainingCredits}
          />
        </div>
      </div>

      {/* RIGHT COLUMN: CANVAS / OUTPUT */}
      <div className="flex-1 relative flex flex-col bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,26,26,0.03)_0%,_transparent_100%)] pointer-events-none" />

        <div className="flex-1 overflow-y-auto p-12">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center space-y-8"
              >
                <Loader2 className="w-12 h-12 text-[#ff1a1a] animate-spin" />
                <p className="text-sm font-bold tracking-widest text-white uppercase animate-pulse">Generating...</p>
              </motion.div>
            ) : (
              /* Step 8: Show Generated Images */
              generatedImages.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto"
                >
                  {generatedImages.map((img) => (
                    <div key={img.id} className="group relative rounded-2xl overflow-hidden border border-white/10 cursor-pointer">
                      <img
                        src={getAIImageUrl(img.url)}
                        alt="AI Generation"
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        onClick={() => openPreview(getAIImageUrl(img.url))}
                      />
                      {/* Dark overlay for actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 pointer-events-none" />

                      {/* Preview Fullscreen Button (Centered) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(getAIImageUrl(img.url));
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20 hover:scale-110 hover:bg-white/20 z-10"
                        title="Preview Full Image"
                      >
                        <Maximize className="w-6 h-6 outline-none" />
                      </button>

                      {/* Actions Wrapper (Bottom Right) */}
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                        {/* Upscale Button */}
                        <button
                          onClick={(e) => handleQuickUpscale(e, img.url, img.id)}
                          disabled={upscalingId === img.id}
                          className="px-4 h-[42px] rounded-xl bg-black/50 backdrop-blur-md text-white flex items-center justify-center gap-2 border border-white/10 hover:scale-105 hover:bg-[#ff1a1a]/80 hover:border-[#ff1a1a]/50 disabled:opacity-50 disabled:pointer-events-none transition-all font-bold text-[10px] tracking-[0.2em] uppercase"
                          title="Upscale & Download"
                        >
                          {upscalingId === img.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 outline-none animate-spin" />
                              <span>Upscaling...</span>
                            </>
                          ) : (
                            <span>Upscale</span>
                          )}
                        </button>

                        {/* Download Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(getAIImageUrl(img.url), img.filename || `generated-${img.id}.png`);
                          }}
                          className="w-[42px] h-[42px] rounded-xl bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:scale-110 hover:bg-black/80 transition-all"
                          title="Download Original Image"
                        >
                          <Download className="w-4 h-4 outline-none" />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                /* EMPTY STATE */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] border border-white/5 flex items-center justify-center group">
                    <LayoutGrid className="w-10 h-10 text-gray-700 group-hover:text-[#ff1a1a] transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">System Idle</h2>
                    <p className="text-sm text-gray-500 max-w-[280px]">
                      Ready to transform your prompts into high-fidelity textile designs.
                    </p>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closePreview}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => handleDownload(previewImage, `generated-${Date.now()}.png`)}
                  className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
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
