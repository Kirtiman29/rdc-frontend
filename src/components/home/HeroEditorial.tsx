import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTrendingDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';

const HeroEditorial = () => {
  const [trendingProducts, setTrendingProducts] = useState<Design[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // ✅ Sync: Fetch real-time trending feed from Admin Service (Port 8080)
        const data = await getTrendingDesigns(4);
        setTrendingProducts(data);
      } catch (error) {
        console.error('Failed to sync trending hero feed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const totalSlides = trendingProducts.length;
  const currentProduct = trendingProducts[currentIndex];

  const goToSlide = useCallback((index: number, dir: 'left' | 'right') => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 800);
  }, [isAnimating]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? totalSlides - 1 : currentIndex - 1;
    goToSlide(newIndex, 'left');
  }, [currentIndex, totalSlides, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex === totalSlides - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex, 'right');
  }, [currentIndex, totalSlides, goToSlide]);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [goToNext, totalSlides]);

  if (loading) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentProduct) return null;

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <section className="relative bg-background overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-[85vh] lg:min-h-[90vh]">
        
        {/* Left: Full-Bleed Editorial Image (75%) */}
        <div className="relative w-full lg:w-[75%] h-[55vh] lg:h-auto overflow-hidden">
          <div 
            className="absolute inset-0 z-20 pointer-events-none opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background/20 to-transparent z-10 pointer-events-none hidden lg:block" />
          
          <div
            className={`absolute inset-0 transition-all duration-[800ms] ease-out ${
              isAnimating 
                ? `opacity-0 ${direction === 'right' ? '-translate-x-6' : 'translate-x-6'}` 
                : 'opacity-100 translate-x-0'
            }`}
          >
            <div className="relative w-full h-full group cursor-pointer">
              <img
                // ✅ Sync: Mapping assetUuid to Port 8090 Media Service
                src={getAssetUrl(currentProduct.assetUuid)}
                alt={currentProduct.title}
                className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.02] filter saturate-[0.92] contrast-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/5 pointer-events-none" />
            </div>
          </div>

          <div className="absolute bottom-10 left-10 hidden lg:flex items-center gap-2 z-20">
            <button
              onClick={goToPrevious}
              disabled={isAnimating}
              className="w-12 h-12 border border-background/40 bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 hover:border-background/60 transition-all duration-300 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNext}
              disabled={isAnimating}
              className="w-12 h-12 border border-background/40 bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 hover:border-background/60 transition-all duration-300 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="absolute bottom-10 right-10 z-20 hidden lg:block">
            <div className="flex items-baseline gap-1 text-background/90">
              <span className="font-serif text-2xl tracking-wide">{formatNumber(currentIndex + 1)}</span>
              <span className="text-background/50 text-sm mx-1">/</span>
              <span className="text-background/60 text-sm">{formatNumber(totalSlides)}</span>
            </div>
          </div>
        </div>

        {/* Right: Editorial Content Column (25%) */}
        <div className="w-full lg:w-[25%] flex flex-col justify-center px-6 py-12 lg:px-10 lg:py-20 xl:px-14">
          <div
            className={`transition-all duration-700 delay-150 ${
              isAnimating ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
            }`}
          >
            <span className="inline-block text-[10px] font-medium uppercase tracking-[0.4em] text-muted-foreground mb-8">
              Trending Design
            </span>

            <h1 className="font-serif text-2xl md:text-3xl lg:text-[2rem] xl:text-[2.5rem] font-medium leading-[1.1] text-foreground mb-6 tracking-tight">
              {currentProduct.title}
            </h1>

            <p className="text-muted-foreground text-sm lg:text-base leading-relaxed mb-8 line-clamp-2">
              {currentProduct.description}
            </p>

            <div className="flex items-baseline gap-3 mb-10">
              {/* ✅ Sync: Industrial Price Rendering (Paise to Rupees) */}
              <span className="font-serif text-2xl lg:text-3xl text-foreground">
                ₹{(currentProduct.finalPriceCents / 100).toLocaleString('en-IN')}
              </span>
              {currentProduct.discountPercent > 0 && (
                <span className="text-base text-muted-foreground/60 line-through">
                  ₹{(currentProduct.basePriceCents / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <Button asChild size="lg" className="w-full px-8 py-6 text-xs tracking-[0.15em] uppercase font-medium">
              <Link to={`/product/${currentProduct.id}`}>
                View Design
              </Link>
            </Button>

            <div className="mt-12">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
                {currentProduct.category?.name || currentProduct.segment?.replace('_', ' ') || 'Collection'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-20">
        <button
          onClick={goToPrevious}
          disabled={isAnimating}
          className="w-10 h-10 border border-foreground/20 bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-baseline gap-1 text-foreground">
          <span className="font-serif text-lg">{formatNumber(currentIndex + 1)}</span>
          <span className="text-muted-foreground/50 mx-1">/</span>
          <span className="text-muted-foreground text-sm">{formatNumber(totalSlides)}</span>
        </div>
        <button
          onClick={goToNext}
          disabled={isAnimating}
          className="w-10 h-10 border border-foreground/20 bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default HeroEditorial;