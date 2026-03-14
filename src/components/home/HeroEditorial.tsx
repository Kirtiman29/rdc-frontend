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
}

const HeroEditorial = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<CategorySlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Touch Swipe Refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response: any = await getDesigns({ size: 50 }); 
        const allFetched = response?.content || (Array.isArray(response) ? response : []);

        if (allFetched.length === 0) {
          setLoading(false);
          return;
        }

        const categoryConfigs = [
          { label: 'TRENDING DESIGNS', subtitle: 'COLOURFUL, GEOMETRICAL AND SOPHISTICATED', filter: (d: Design) => d.trending === true, link: '/trends' },
          { label: 'LUXURY PATTERNS', subtitle: 'EXCLUSIVE, REFINED AND PREMIUM', filter: (d: Design) => d.luxury === true, link: '/luxury' },
          { label: 'NEW ARRIVALS', subtitle: 'MODERN, INNOVATIVE AND FRESH', filter: (d: Design) => d.newArrival === true, link: '/gallery?newArrival=true' },
          { label: "EDITORS' CHOICE", subtitle: 'CURATED, AUTHENTIC AND UNIQUE', filter: (d: Design) => d.editorsPick === true, link: '/gallery?editorsPick=true' },
          { label: 'SPECIAL OFFERS', subtitle: 'LIMITED, ACCESSIBLE AND ELITE', filter: (d: Design) => d.specialOffer === true, link: '/special-offers' },
        ];

        const slideData: CategorySlide[] = [];
        categoryConfigs.forEach((config) => {
          let filtered = allFetched.filter(config.filter).sort((a: Design, b: Design) => b.id - a.id).slice(0, 2);
          if (filtered.length < 2) {
            const fallback = [...allFetched].sort((a: Design, b: Design) => b.id - a.id).filter((d: Design) => !filtered.some(f => f.id === d.id)).slice(0, 2 - filtered.length);
            filtered = [...filtered, ...fallback];
          }
          if (filtered.length > 0) {
            slideData.push({ label: config.label, subtitle: config.subtitle, link: config.link, designs: filtered });
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
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 800);
  }, [isAnimating, currentIndex]);

  const goToNext = useCallback(() => {
    if (slides.length <= 1) return;
    const nextIndex = (currentIndex + 1) % slides.length;
    goToSlide(nextIndex);
  }, [currentIndex, slides.length, goToSlide]);

  const goToPrev = useCallback(() => {
    if (slides.length <= 1) return;
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(prevIndex);
  }, [currentIndex, slides.length, goToSlide]);

  // ✅ TOUCH HANDLERS for Hand Sliding (Swipe)
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
    const isSwipe = Math.abs(distance) > 50; // Minimum swipe distance

    if (isSwipe) {
      if (distance > 0) goToNext(); // Swipe Left -> Next
      else goToPrev(); // Swipe Right -> Prev
    }
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goToNext, 7500);
    return () => clearInterval(timer);
  }, [goToNext, slides.length]);

  if (loading) return (
    <div className="flex h-[70vh] items-center justify-center bg-[#FBFAF9]">
      <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
    </div>
  );

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const leftDesign = currentSlide.designs[0];
  const rightDesign = currentSlide.designs[1] || currentSlide.designs[0];

  return (
    <>
      <section
        className="relative overflow-hidden select-none py-10 md:py-24 lg:py-28 bg-[#FBFAF9] touch-pan-y"
        onContextMenu={handleContextMenu}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="container mx-auto px-2 md:px-8 max-w-[1400px]">
          <div className="relative flex flex-row items-center justify-between gap-2 sm:gap-6 md:gap-10 lg:gap-16 min-h-[320px] sm:min-h-[480px] lg:min-h-[520px]">
            
            {/* Left Card */}
            <div className={cn(
              'w-[28%] flex justify-center transition-all duration-700 ease-out',
              isAnimating ? 'opacity-0 -translate-x-4 scale-[0.95]' : 'opacity-100 translate-x-0 scale-100'
            )}>
              {leftDesign && (
                <Link to={`/product/${leftDesign.id}`} className="group relative block w-full max-w-[120px] sm:max-w-[220px] lg:max-w-[280px] aspect-[3/4] rounded-[6px] sm:rounded-[10px] overflow-hidden shadow-lg transition-all duration-500 -rotate-[2deg] sm:-rotate-[3deg]">
                  <img src={getAssetUrl(leftDesign.assetUuid)} className="w-full h-full object-cover" alt={leftDesign.title} draggable={false} />
                </Link>
              )}
            </div>

            {/* Center Content */}
            <div className={cn(
              'w-[44%] flex flex-col items-center justify-center text-center z-10 transition-all duration-700 ease-out',
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}>
              <p className="text-[7px] sm:text-[10px] md:text-xs uppercase tracking-[0.35em] font-medium text-[#6b7280] mb-2 sm:mb-5">
                {currentSlide.subtitle}
              </p>
              <h1 className="font-serif text-lg sm:text-4xl md:text-6xl lg:text-7xl font-normal text-[#1a1a1a] leading-tight tracking-tight mb-4 sm:mb-10">
                {currentSlide.label}
              </h1>
              <Button
                onClick={() => navigate(currentSlide.link)}
                variant="outline"
                className="rounded-full px-4 sm:px-10 py-2 sm:py-5 h-auto border border-[#1a1a1a]/70 text-[#1a1a1a] font-medium hover:bg-[#1a1a1a] hover:text-white transition-all text-[8px] sm:text-[11px] uppercase tracking-widest"
              >
                Explore
              </Button>
            </div>

            {/* Right Card */}
            <div className={cn(
              'w-[28%] flex justify-center transition-all duration-700 ease-out',
              isAnimating ? 'opacity-0 translate-x-4 scale-[0.95]' : 'opacity-100 translate-x-0 scale-100'
            )}>
              {rightDesign && (
                <Link to={`/product/${rightDesign.id}`} className="group relative block w-full max-w-[120px] sm:max-w-[220px] lg:max-w-[280px] aspect-[3/4] rounded-[6px] sm:rounded-[10px] overflow-hidden shadow-lg transition-all duration-500 rotate-[2deg] sm:rotate-[3deg]">
                  <img src={getAssetUrl(rightDesign.assetUuid)} className="w-full h-full object-cover" alt={rightDesign.title} draggable={false} />
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Dots */}
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