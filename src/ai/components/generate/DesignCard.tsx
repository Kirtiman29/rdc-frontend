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
      className="group overflow-hidden rounded-3xl bg-[#0c0c0c] border border-white/5 shadow-2xl transition-all duration-500 hover:border-[#ff1a1a]/30"
    >
      <button
        type="button"
        onClick={onPreview}
        className="block w-full overflow-hidden"
      >
        <div className="aspect-[3/4] overflow-hidden bg-[#111111]">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      </button>

      <div className="space-y-3 p-4">
          <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#ff1a1a]">
            Textile Design
          </p>
          <h3 className="mt-2 truncate text-sm font-semibold text-white">
            {title}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Preview full screen"
              onClick={(e) => {
                e.stopPropagation();
                onPreview?.();
              }}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:border-[#ff1a1a]/40 hover:text-white hover:bg-[#ff1a1a]/10"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Download"
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.();
              }}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:border-[#ff1a1a]/40 hover:text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            title="Favorite"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="rounded-2xl bg-white/5 p-2 text-gray-300 transition hover:bg-[#ff1a1a]/10 hover:text-[#ff1a1a]"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}