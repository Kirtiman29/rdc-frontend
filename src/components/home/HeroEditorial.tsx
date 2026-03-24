// src/components/home/HeroEditorial
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';
import { cn } from '@/lib/utils';

interface CategorySlide {
  label: string;
  subtitle: string;
  designs: Design[];
  link: string;
  type?: 'design' | 'branding';
}

const HeroEditorial = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<CategorySlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response: any = await getDesigns({ size: 50 });
        const allFetched = response?.content || (Array.isArray(response) ? response : []);

        const categoryConfigs = [
          { label: 'TRENDING DESIGNS', subtitle: 'COLOURFUL, GEOMETRICAL AND SOPHISTICATED', filter: (d: Design) => d.trending === true, link: '/trends' },
          { label: 'LUXURY PATTERNS', subtitle: 'EXCLUSIVE, REFINED AND PREMIUM', filter: (d: Design) => d.luxury === true, link: '/luxury' },
          { label: 'NEW ARRIVALS', subtitle: 'MODERN, INNOVATIVE AND FRESH', filter: (d: Design) => d.newArrival === true, link: '/gallery?newArrival=true' },
          { label: "EDITOR'S CHOICE", subtitle: 'CURATED, AUTHENTIC AND UNIQUE', filter: (d: Design) => d.editorsPick === true, link: '/gallery?editorsPick=true' },
          { label: 'SPECIAL OFFERS', subtitle: 'LIMITED, ACCESSIBLE AND ELITE', filter: (d: Design) => d.specialOffer === true, link: '/special-offers' },
        ];

        const slideData: CategorySlide[] = [];

        slideData.push({
          label: "INDIA'S LARGEST TEXTILE STUDIO",
          subtitle: "POWERING NEXT-GEN TEXTILE DESIGN INFRASTRUCTURE",
          link: "/gallery",
          designs: [],
          type: 'branding'
        });

        const usedDesignIds = new Set<number>();

categoryConfigs.forEach((config) => {
  let filtered = allFetched
    .filter(config.filter)
    .sort((a: Design, b: Design) => b.id - a.id)
    .filter((d: Design) => !usedDesignIds.has(d.id)) // 🔥 KEY FIX
    .slice(0, 2);

  // mark as used
  filtered.forEach(d => usedDesignIds.add(d.id));

  if (filtered.length < 2 && allFetched.length > 0) {
    const fallback = [...allFetched]
      .sort((a: Design, b: Design) => b.id - a.id)
      .filter((d: Design) => !usedDesignIds.has(d.id))
      .slice(0, 2 - filtered.length);

    fallback.forEach(d => usedDesignIds.add(d.id));

    filtered = [...filtered, ...fallback];
  }

  if (filtered.length > 0) {
    slideData.push({
      label: config.label,
      subtitle: config.subtitle,
      link: config.link,
      designs: filtered,
      type: 'design'
    });
  }
});

        setSlides(slideData);
      } catch (error) {
        console.error('Hero system failure:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllCategories();
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 800);
  }, [isAnimating]);

  const goToNext = useCallback(() => {
    if (slides.length <= 1 || isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 800);
  }, [slides.length, isAnimating]);

  const goToPrev = useCallback(() => {
    if (slides.length <= 1 || isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 800);
  }, [slides.length, isAnimating]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0) goToNext();
      else goToPrev();
    }
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [goToNext, slides.length]);

  if (loading) return (
    <div className="flex h-[70vh] items-center justify-center bg-[#FBFAF9]">
      <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
    </div>
  );

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const isBrandingSlide = currentSlide.type === 'branding';
  const leftDesign = currentSlide.designs[0];
  const rightDesign = currentSlide.designs[1] || currentSlide.designs[0];

  const normalizedLabel = currentSlide.label
    .replace(/['’]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
  const isEditorsChoice = normalizedLabel === "EDITORSCHOICE";

  return (
    <>
      <section
        className="relative overflow-hidden select-none py-6 md:py-12 lg:py-16 bg-[#FBFAF9] touch-pan-y transition-all duration-700 ease-in-out"
        onContextMenu={handleContextMenu}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {isBrandingSlide && (
          <div className="absolute inset-0 flex justify-center items-center -z-0 pointer-events-none">
            <div className="w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#BA1B1C]/5 blur-[100px] sm:blur-[120px] rounded-full animate-pulse" />
          </div>
        )}

        <div className="container mx-auto px-2 md:px-8 max-w-[1400px] relative z-10">
          {/* STEP 3: Height Fix */}
          <div className="relative flex flex-row items-center justify-between gap-2 sm:gap-6 md:gap-10 lg:gap-16 min-h-[280px] sm:min-h-[380px] lg:min-h-[420px]">
            
            {/* STEP 1: Left Card Fix */}
            <div className={cn(
              'w-[28%] flex justify-center transition-all duration-700 ease-out',
              isAnimating ? 'opacity-0 -translate-x-4 scale-[0.95]' : 'opacity-100 translate-x-0 scale-100'
            )}>
              {!isBrandingSlide && leftDesign && (
                <Link to={`/product/${leftDesign.id}`} className="group relative block w-full max-w-[120px] sm:max-w-[220px] lg:max-w-[280px] aspect-[3/4] rounded-[6px] sm:rounded-[10px] overflow-hidden shadow-lg transition-all duration-500 -rotate-[2deg] sm:-rotate-[3deg]">
                  <img src={getAssetUrl(leftDesign.assetUuid)} className="w-full h-full object-cover" alt={leftDesign.title} draggable={false} />
                </Link>
              )}
            </div>

            {/* Center Content */}
            <div className={cn(
              'flex flex-col items-center justify-center text-center z-10 transition-all duration-700 ease-out',
              'w-[44%] min-h-[180px] sm:min-h-[240px]',
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}>
              <p className="text-[7px] sm:text-[10px] md:text-xs uppercase tracking-[0.35em] font-medium text-[#6b7280] mb-2 sm:mb-5">
                {currentSlide.subtitle}
              </p>

              <h1
                className={cn(
                  "font-serif font-normal leading-tight tracking-tight transition-all duration-500",
                  "mb-3 sm:mb-6", // STEP 6: Spacing Fix
                  isBrandingSlide
                    ? "text-2xl sm:text-5xl md:text-7xl lg:text-7xl text-[#1a1a1a] animate-[fadeInUp_0.8s_ease]" // STEP 5: Animation
                    : isEditorsChoice
                    ? "text-[#D0010F] text-lg sm:text-4xl md:text-6xl lg:text-7xl"
                    : "text-[#1a1a1a] text-lg sm:text-4xl md:text-6xl lg:text-7xl"
                )}
              >
                {isBrandingSlide ? (
                  <>
                    INDIA'S LARGEST <br />
                    <span className="text-[#BA1B1C] italic">TEXTILE STUDIO</span>
                  </>
                ) : (
                  currentSlide.label
                )}
              </h1>

              <Button
  onClick={() => navigate(currentSlide.link)}
  className={cn(
    "rounded-full px-4 sm:px-10 py-2 sm:py-5 h-auto font-medium transition-all duration-300 text-[8px] sm:text-[11px] uppercase tracking-widest",

    isBrandingSlide
      // 🔴 Branding Slide (Hero Red Button)
      ? "bg-[#BA1B1C] text-white border border-[#BA1B1C] hover:bg-[#8E1415] hover:scale-[1.03] active:scale-[0.98] shadow-[0_10px_30px_rgba(186,27,28,0.25)]"

      // ⚪ Normal Slides (Elegant Minimal Button)
      : "border border-[#1a1a1a]/40 text-[#1a1a1a] bg-transparent hover:border-[#1a1a1a] hover:scale-[1.03] active:scale-[0.98]"
  )}
>
  Explore {isBrandingSlide && "Platform"}
</Button>
            </div>

            {/* STEP 2: Right Card Fix */}
            <div className={cn(
              'w-[28%] flex justify-center transition-all duration-700 ease-out',
              isAnimating ? 'opacity-0 translate-x-4 scale-[0.95]' : 'opacity-100 translate-x-0 scale-100'
            )}>
              {!isBrandingSlide && rightDesign && (
                <Link to={`/product/${rightDesign.id}`} className="group relative block w-full max-w-[120px] sm:max-w-[220px] lg:max-w-[280px] aspect-[3/4] rounded-[6px] sm:rounded-[10px] overflow-hidden shadow-lg transition-all duration-500 rotate-[2deg] sm:rotate-[3deg]">
                  <img src={getAssetUrl(rightDesign.assetUuid)} className="w-full h-full object-cover" alt={rightDesign.title} draggable={false} />
                </Link>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-8 sm:mt-16 mb-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => !isAnimating && goToSlide(i)}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  currentIndex === i ? 'w-6 sm:w-8 bg-[#1a1a1a]' : 'w-1 sm:w-1.5 bg-neutral-400'
                )}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
        <div className="w-full h-[1px] bg-zinc-100" />
      </div>
    </>
  );
};

export default HeroEditorial;