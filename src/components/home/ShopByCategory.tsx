//src/components/home/ShopByCategory.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '@/api/designApi';
import { Loader2, ArrowRight } from 'lucide-react';
import type { Category } from '@/types/product';
import { getCategoryPath } from '@/utils/routes';

const ShopByCategory = () => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Security: Global section right-click restriction
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  /**
   * ✅ FINAL DYNAMIC IMAGE RESOLVER
   * 1. Replaces 'localhost' with the current server IP from .env.
   * 2. Prevents double '/download' pathing.
   * 3. Fixes protocol mismatch (Mixed Content).
   */
  const resolveImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl || imageUrl === 'null') return 'https://placehold.co/600x600?text=Design+Collection';

    try {
      const ASSET_BASE = import.meta.env.VITE_ASSET_SERVICE_URL; // e.g., http://192.168.0.17:8090

      // Case 1: Handle legacy stored URLs (localhost or direct IP)
      if (imageUrl.includes('/assets/') || imageUrl.includes('/api/assets/')) {
        const parts = imageUrl.split('/');
        // The UUID is usually the segment before '/download' or the last segment
        const uuid = imageUrl.includes('/download') 
          ? parts[parts.indexOf('assets') + 1] 
          : parts[parts.length - 1];
        
        return `${ASSET_BASE}/assets/download/${uuid}`;
      }

      // Case 2: If only a raw UUID is provided
      if (!imageUrl.startsWith('http')) {
        return `${ASSET_BASE}/assets/download/${imageUrl}`;
      }

      // Case 3: Already correct (External link)
      return imageUrl;

    } catch (error) {
      console.error("Image resolution error:", error);
      return 'https://placehold.co/600x600?text=Design+Collection';
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        const safeData = Array.isArray(data) ? data : [];
        const sortedCategories = [...safeData].sort((a, b) => b.id - a.id);
        setDbCategories(sortedCategories);
      } catch (error) {
        console.error('Failed to sync gallery categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (dbCategories.length === 0) return null;

  const displayedCategories = dbCategories.slice(0, 6);

  return (
    <section className="py-20 md:py-24 bg-[#FBFAF9]" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="text-left max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2A2623] mb-4 block">
              Curated Collections
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#2A2623] mb-4">
              Shop by Category
            </h2>
            <p className="text-[#2A2623]/60 text-base md:text-lg font-light leading-relaxed">
              Shop by print style, find exactly what your collection needs, and move straight into production no searching, no waiting.
            </p>
          </div>
          <Link 
            to="/gallery" 
            className="group flex items-center gap-2 px-8 py-3 border border-[#2A2623]/20 hover:border-[#2A2623] text-[#2A2623] text-xs font-bold uppercase tracking-widest hover:bg-[#2A2623] hover:text-white transition-all duration-300 rounded-sm shrink-0"
          >
            Explore All
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[300px] grid-flow-row-dense">
          {displayedCategories.map((category, index) => {
            const isHero = index % 3 === 0;
            return (
              <Link 
                key={category.id} 
                to={getCategoryPath(category)} 
                className={`group relative overflow-hidden bg-neutral-100 block select-none ${
                  isHero ? 'md:col-span-2 md:row-span-2 h-[420px] md:h-auto' : 'md:col-span-1 md:row-span-1 h-[280px] md:h-auto'
                }`}
              >
                {/* ✅ UPDATED IMG SRC WITH FINAL RESOLVER */}
                <img
                  src={resolveImageUrl(category.imageUrl)}
                  alt={category.name}
                  draggable={false} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=Category'; }}
                />
                
                {/* Cinematic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                {/* Bottom Left Content */}
                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white z-20 flex flex-col justify-end transform transition-transform duration-500 group-hover:-translate-y-1">
                  <h3 className="font-serif text-3xl md:text-4xl drop-shadow-md mb-2 md:mb-3">
                    {category.name}
                  </h3>
                  
                  {/* Category Story / Descriptor */}
                  {isHero && (
                    <p className="text-sm font-medium text-white/90 max-w-sm hidden md:block mb-4 leading-relaxed">
                      Discover elegant prints and contemporary designs curated exclusively for the {category.name} collection.
                    </p>
                  )}

                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] flex items-center gap-1.5 text-white/90 group-hover:text-white transition-colors">
                    Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
