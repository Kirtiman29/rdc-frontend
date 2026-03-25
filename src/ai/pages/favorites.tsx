// path: src/ai/pages/Favorites.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, Download, Share2, Sparkles } from "lucide-react";
import { useState } from "react";

const initialDesigns = [
  { id: 1, image: "/src/assets/sample-pattern-1.jpg", title: "Floral Dark" },
  { id: 2, image: "/src/assets/sample-pattern-2.jpg", title: "Gold Lattice" },
  { id: 3, image: "/src/assets/sample-pattern-3.jpg", title: "Red Paisley" },
  { id: 4, image: "/src/assets/sample-pattern-4.jpg", title: "Abstract Brush" },
  { id: 5, image: "/src/assets/sample-pattern-5.jpg", title: "Ethnic Stripe" },
  { id: 6, image: "/src/assets/sample-pattern-6.jpg", title: "Rose Garden" },
];

export default function Favorites() {
  const [designs, setDesigns] = useState(initialDesigns);

  const removeFavorite = (id: number) => {
    setDesigns(designs.filter(d => d.id !== id));
  };

  return (
    <div className="h-full bg-[#050505] p-8 overflow-y-auto custom-scrollbar">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-[#ff1a1a] fill-[#ff1a1a]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
              Curated Collection
            </span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            FAVORITES <span className="text-gray-700 font-light">({designs.length})</span>
          </h1>
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      {/* GRID SECTION */}
      <AnimatePresence mode="popLayout">
        {designs.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {designs.map((design) => (
              <motion.div
                key={design.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                className="group relative aspect-[4/5] rounded-2xl bg-[#0a0a0a] border border-white/5 overflow-hidden shadow-2xl"
              >
                {/* Image */}
                <img 
                  src={design.image} 
                  alt={design.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-xs font-bold text-[#ff1a1a] mb-1 tracking-widest uppercase">Pattern</p>
                  <h3 className="text-lg font-bold text-white mb-4">{design.title}</h3>
                  
                  <div className="flex items-center gap-2">
                    <button className="flex-1 py-2 bg-white text-black text-[10px] font-black rounded-lg hover:bg-gray-200 transition-colors uppercase tracking-tighter">
                      Open in Studio
                    </button>
                    <button 
                      onClick={() => removeFavorite(design.id)}
                      className="p-2 bg-white/10 text-white rounded-lg hover:bg-[#ff1a1a]/20 hover:text-[#ff1a1a] transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[#ff1a1a]">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-gray-800" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-xs">Start exploring and save your favorite patterns to your personal collection.</p>
            <button className="px-8 py-3 bg-[#ff1a1a] text-white font-bold rounded-xl flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Explore Patterns
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}