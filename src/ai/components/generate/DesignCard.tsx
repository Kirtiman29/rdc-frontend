// path: src/ai/components/generate/DesignCard.tsx
import { Download, Heart, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";

interface DesignCardProps {
  image: string;
  title: string;
  onPreview?: () => void;
  onDownload?: () => void;
}

export function DesignCard({ image, title, onPreview, onDownload }: DesignCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/5 hover:border-[#ff1a1a]/40 transition-all duration-500 shadow-2xl"
    >
      {/* IMAGE CONTAINER */}
      <div 
        className="aspect-[3/4] overflow-hidden relative cursor-pointer"
        onClick={onPreview}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
        />
        
        {/* OVERLAY ON HOVER */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* CARD FOOTER */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-between translate-y-[2px] group-hover:translate-y-0 transition-transform">
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <span className="text-[10px] font-black text-[#ff1a1a] uppercase tracking-tighter leading-none mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Textile Design
          </span>
          <span className="text-xs font-bold text-white truncate w-full">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button 
            title="Preview Fullscreen"
            onClick={(e) => { e.stopPropagation(); onPreview?.(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button 
            title="Download"
            onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button 
            title="Favorite"
            onClick={(e) => { e.stopPropagation(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#ff1a1a] hover:bg-[#ff1a1a]/10 transition-all"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}