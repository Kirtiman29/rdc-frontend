import { useState, useEffect, useCallback } from 'react';
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

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        // Fetch a larger pool to ensure we find enough matches for specific flags
        const response = await getDesigns({ limit: 100 }); 
        const allFetched = Array.isArray(response) ? response : (response?.content || []);

        const categoryConfigs = [
          {
            label: 'TRENDING DESIGNS',
            subtitle: 'COLOURFUL, GEOMETRICAL AND SOPHISTICATED',
            filter: (d: Design) => d.trending === true,
            link: '/trends',
          },
          {
            label: 'PREMIUM DESIGNS',
            subtitle: 'EXCLUSIVE, REFINED AND LUXURIOUS',
            filter: (d: Design) => d.premium === true,
            link: '/premium',
          },
          {
            label: 'NEW ARRIVALS',
            subtitle: 'FRESH, INNOVATIVE AND MODERN',
            filter: (d: Design) => d.newArrival === true || true, // Default true for new arrivals
            link: '/gallery?newArrival=true',
          },
          {
            label: "EDITORS' CHOICE",
            subtitle: 'CURATED, AUTHENTIC AND UNIQUE',
            filter: (d: Design) => d.editorsPick === true,
            link: '/gallery?editorsPick=true',
          },
          {
            label: 'SPECIAL OFFERS',
            subtitle: 'LIMITED, ACCESSIBLE AND ELITE',
            filter: (d: Design) => d.specialOffer === true,
            link: '/special-Offers',
          },
        ];

        const slideData: CategorySlide[] = [];

        categoryConfigs.forEach((config) => {
          // ✅ FIX: Logic now independently finds the most RECENT designs per segment
          let designs = allFetched
            .filter(config.filter)
            .sort((a: Design, b: Design) => b.id - a.id) // Sort by ID descending for most recent
            .slice(0, 2);

          // Fallback: If no designs have the specific flag (e.g., no Special Offers yet), 
          // use the absolute newest designs from the general catalog to prevent empty slides.
          if (designs.length < 2) {
            const fallback = allFetched
              .sort((a: Design, b: Design) => b.id - a.id)
              .filter(d => !designs.some(existing => existing.id === d.id))
              .slice(0, 2 - designs.length);
            designs = [...designs, ...fallback];
          }

          slideData.push({
            label: config.label,
            subtitle: config.subtitle,
            link: config.link,
            designs: designs,
          });
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
    if (isAnimating || index === currentIndex || index < 0 || index >= slides.length) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 800);
  }, [isAnimating, currentIndex, slides.length]);

  const goToNext = useCallback(() => {
    if (slides.length === 0) return;
    const newIndex = (currentIndex + 1) % slides.length;
    goToSlide(newIndex);
  }, [currentIndex, slides.length, goToSlide]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goToNext, 7500);
    return () => clearInterval(timer);
  }, [goToNext, slides.length]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center bg-[#FBFAF9]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const leftDesign = currentSlide.designs[0];
  const rightDesign = currentSlide.designs[1] || currentSlide.designs[0];

  return (
    <>
      <section
        className="relative overflow-hidden select-none py-10 md:py-24 lg:py-28 bg-[#FBFAF9]"
        onContextMenu={handleContextMenu}
      >
        <div className="container mx-auto px-2 md:px-8 max-w-[1400px]">
          <div className="
            relative 
            flex flex-row 
            items-center 
            justify-between 
            gap-2 sm:gap-6 md:gap-10 lg:gap-16
            min-h-[320px] sm:min-h-[480px] lg:min-h-[520px]
          ">
            
            {/* 1️⃣ Left Card */}
            <div className={cn(
              'w-[28%] flex justify-center transition-all duration-700 ease-out',
              isAnimating ? 'opacity-0 -translate-x-4 scale-[0.95]' : 'opacity-100 translate-x-0 scale-100'
            )}>
              {leftDesign && (
                <Link
                  to={`/product/${leftDesign.id}`}
                  className="group relative block w-full max-w-[120px] sm:max-w-[220px] lg:max-w-[280px] aspect-[3/4] rounded-[6px] sm:rounded-[10px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-[1.02] -rotate-[2deg] sm:-rotate-[3deg]"
                >
                  <img
                    src={getAssetUrl(leftDesign.assetUuid)}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    alt={leftDesign.title}
                  />
                </Link>
              )}
            </div>

            {/* 2️⃣ Center Content */}
            <div className={cn(
              'w-[44%] flex flex-col items-center justify-center text-center z-10 transition-all duration-700 ease-out',
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            )}>
              <p className="text-[7px] sm:text-[10px] md:text-xs uppercase tracking-[0.2em] sm:tracking-[0.35em] font-medium sm:font-light text-[#6b7280] mb-2 sm:mb-5">
                {currentSlide.subtitle}
              </p>
              <h1 className="font-serif text-lg sm:text-4xl md:text-6xl lg:text-7xl font-normal text-[#1a1a1a] leading-tight sm:leading-[1.08] tracking-tight mb-4 sm:mb-10 italic">
                {currentSlide.label}
              </h1>
              <Button
                onClick={() => navigate(currentSlide.link)}
                variant="outline"
                className="rounded-full px-3 sm:px-10 py-2 sm:py-5 h-auto border border-[#1a1a1a]/70 text-[#1a1a1a] font-medium hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 text-[8px] sm:text-[11px] tracking-[0.1em] sm:tracking-[0.2em] uppercase"
              >
                Explore
              </Button>
            </div>

            {/* 3️⃣ Right Card */}
            <div className={cn(
              'w-[28%] flex justify-center transition-all duration-700 ease-out',
              isAnimating ? 'opacity-0 translate-x-4 scale-[0.95]' : 'opacity-100 translate-x-0 scale-100'
            )}>
              {rightDesign && (
                <Link
                  to={`/product/${rightDesign.id}`}
                  className="group relative block w-full max-w-[120px] sm:max-w-[220px] lg:max-w-[280px] aspect-[3/4] rounded-[6px] sm:rounded-[10px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-[1.02] rotate-[2deg] sm:rotate-[3deg]"
                >
                  <img
                    src={getAssetUrl(rightDesign.assetUuid)}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    alt={rightDesign.title}
                  />
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
                  'h-1 rounded-full transition-all duration-300 cursor-pointer',
                  currentIndex === i ? 'w-6 sm:w-8 bg-[#1a1a1a]' : 'w-1 sm:w-1.5 bg-neutral-400 hover:bg-neutral-600'
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Industrial Partition Line */}
      <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
        <div className="w-full h-[1px] bg-zinc-100" />
      </div>
    </>
  );
};

export default HeroEditorial;