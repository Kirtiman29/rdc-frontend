import { useState, useEffect, useCallback, useRef } from 'react';
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

  // ✅ Spotlight Reveal State
  const [isBlurred, setIsBlurred] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Security: Restrict Right-Click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // ✅ Spotlight Logic: Follow Mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
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

  // ✅ Timer Logic: Trigger Blur after 3 seconds (REDUCED)
  useEffect(() => {
    if (loading || !currentProduct) return;
    
    // Reset blur whenever we change slides
    setIsBlurred(false);
    
    const blurTimer = setTimeout(() => {
      setIsBlurred(true);
    }, 3000); // 3 Seconds visible, then transition to blur

    return () => clearTimeout(blurTimer);
  }, [currentIndex, loading]);

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
    }, 10000); // Allow time for 3s reveal + interaction
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
    <section className="relative bg-background overflow-hidden" onContextMenu={handleContextMenu}>
      <div className="flex flex-col lg:flex-row min-h-[85vh] lg:min-h-[90vh]">
        
        {/* Left: Image Column (75%) */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="relative w-full lg:w-[75%] h-[55vh] lg:h-auto overflow-hidden select-none cursor-none"
        >
          
          {/* ✅ WATERMARK (z-50: Topmost layer) */}
          <div 
            className="absolute inset-0 z-50 pointer-events-none opacity-[0.25]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 150 150' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='24' font-weight='900' fill='none' stroke='white' stroke-width='1' text-anchor='middle' transform='rotate(-35 75 75)'%3ERDC%3C/text%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          />

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
            <div className="relative w-full h-full group">
              {/* Base Design Image */}
              <img
                src={getAssetUrl(currentProduct.assetUuid)}
                alt={currentProduct.title}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover saturate-[0.92] contrast-[1.01]"
              />

              {/* ✅ BLUR OVERLAY WITH 3s DELAY */}
              <div 
                className={`absolute inset-0 z-30 transition-opacity duration-1000 backdrop-blur-md bg-black/10 ${isBlurred ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  WebkitMaskImage: `radial-gradient(circle 120px at ${mousePos.x}px ${mousePos.y}px, transparent 100%, black 100%)`,
                  maskImage: `radial-gradient(circle 120px at ${mousePos.x}px ${mousePos.y}px, transparent 100%, black 100%)`,
                }}
              />

              <div className="absolute inset-0 bg-black/10 pointer-events-none z-10" />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute bottom-10 left-10 hidden lg:flex items-center gap-2 z-[60]">
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

          <div className="absolute bottom-10 right-10 z-[60] hidden lg:block">
            <div className="flex items-baseline gap-1 text-background/90">
              <span className="font-serif text-2xl tracking-wide">{formatNumber(currentIndex + 1)}</span>
              <span className="text-background/50 text-sm mx-1">/</span>
              <span className="text-background/60 text-sm">{formatNumber(totalSlides)}</span>
            </div>
          </div>
        </div>

        {/* Right: Content Column */}
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
              <span className="font-serif text-2xl lg:text-3xl text-foreground">
                ₹{(currentProduct.finalPriceCents / 100).toLocaleString('en-IN')}
              </span>
              {currentProduct.discountPercent > 0 && (
                <span className="text-base text-muted-foreground/60 line-through">
                  ₹{(currentProduct.basePriceCents / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <Button asChild size="lg" className="w-full px-8 py-6 text-xs tracking-[0.15em] uppercase font-medium bg-[#2A2623] hover:bg-black">
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
    </section>
  );
};

export default HeroEditorial;