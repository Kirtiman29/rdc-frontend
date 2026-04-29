// src/ai/pages/MyDesigns.tsx
import { useState, useEffect } from "react";
import { Search, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DesignCard } from "@/ai/components/generate/DesignCard";
import { getHistory, getAIImageUrl } from "@/api/aiApi";

export default function MyDesigns() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const filters = ["All", "Floral", "Paisley", "Abstract"];

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const styleParam = activeFilter === "All" ? undefined : activeFilter.toLowerCase();
        const data: any = await getHistory(styleParam);
        
        // Handle different possible API wrapper structures comfortably
        const results = Array.isArray(data) ? data : data?.data || data?.history || data?.images || [];
        setDesigns(results);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setDesigns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [activeFilter]);

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

  const filteredDesigns = designs.filter((d) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const title = (d.style ? d.style.charAt(0).toUpperCase() + d.style.slice(1) : "AI Generation").toLowerCase();
    const prompt = (d.prompt || "").toLowerCase();
    return title.includes(searchLower) || prompt.includes(searchLower);
  });

  return (
    <div className="p-6 bg-[#0f0f0f] min-h-screen text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Designs</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search designs..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff1a1a]"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === f
                ? "bg-[#ff1a1a]/10 text-[#ff1a1a]"
                : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff1a1a]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDesigns.map((d, i) => {
            const imageUrl = getAIImageUrl(d.image_url || d.url || d.image || "");
            const title = d.style ? d.style.charAt(0).toUpperCase() + d.style.slice(1) : "AI Generation";
            return (
              <DesignCard 
                key={d.id || i} 
                image={imageUrl} 
                title={title} 
                onPreview={() => setPreviewImage(imageUrl)}
                onDownload={() => handleDownload(imageUrl, d.filename || `design-${d.id || i}.png`)}
              />
            );
          })}
        </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-xl p-4 md:p-8"
            onClick={() => setPreviewImage(null)}
          >
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-8 right-8 w-12 h-12 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 text-white flex items-center justify-center transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
