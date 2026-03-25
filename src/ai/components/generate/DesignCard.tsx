// path: src/ai/components/generate/DesignCard.tsx
import { Download, Heart, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";

interface DesignCardProps {
  image: string;
  title: string;
}

export function DesignCard({ image, title }: DesignCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/5 hover:border-[#ff1a1a]/40 transition-all duration-500 shadow-2xl"
    >
      {/* IMAGE CONTAINER */}
      <div className="aspect-[3/4] overflow-hidden relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
        />
        
        {/* OVERLAY ON HOVER */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
             <button className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white scale-90 group-hover:scale-100 transition-transform duration-300 hover:bg-[#ff1a1a] hover:border-[#ff1a1a]">
                <Maximize2 className="w-5 h-5" />
             </button>
        </div>
      </div>

      {/* CARD FOOTER */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-between translate-y-[2px] group-hover:translate-y-0 transition-transform">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-[#ff1a1a] uppercase tracking-tighter leading-none mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Textile Design
          </span>
          <span className="text-xs font-bold text-white truncate max-w-[100px]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            title="Download"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button 
            title="Favorite"
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#ff1a1a] hover:bg-[#ff1a1a]/10 transition-all"
          >
            <Heart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}