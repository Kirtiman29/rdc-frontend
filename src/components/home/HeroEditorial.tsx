import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTrendingProducts } from '@/data/products';

const HeroEditorial = () => {
  const trendingProducts = getTrendingProducts().slice(0, 4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

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

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [goToNext]);

  if (!currentProduct) return null;

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'digital': 'Digital Pattern',
      'fabric': 'Premium Fabric',
      'custom': 'Custom Design',
      'ready-made': 'Ready Made'
    };
    return labels[category] || category;
  };

  return (
    <section className="relative bg-background overflow-hidden">
      {/* Editorial Hero Container */}
      <div className="flex flex-col lg:flex-row min-h-[85vh] lg:min-h-[90vh]">
        
        {/* Left: Full-Bleed Editorial Image (75%) */}
        <div className="relative w-full lg:w-[75%] h-[55vh] lg:h-auto overflow-hidden">
          {/* Film Grain Overlay */}
          <div 
            className="absolute inset-0 z-20 pointer-events-none opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Soft Shadow Depth */}
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background/20 to-transparent z-10 pointer-events-none hidden lg:block" />
          
          {/* Image with Animation */}
          <div
            className={`absolute inset-0 transition-all duration-[800ms] ease-out ${
              isAnimating 
                ? `opacity-0 ${direction === 'right' ? '-translate-x-6' : 'translate-x-6'}` 
                : 'opacity-100 translate-x-0'
            }`}
          >
            <div className="relative w-full h-full group cursor-pointer">
              <img
                src={currentProduct.images[0]}
                alt={currentProduct.name}
                className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-[1.02] filter saturate-[0.92] contrast-[1.01]"
              />
              {/* Subtle vignette for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/5 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/10 pointer-events-none" />
            </div>
          </div>

          {/* Navigation Arrows - Minimal Style */}
          <div className="absolute bottom-10 left-10 hidden lg:flex items-center gap-2 z-20">
            <button
              onClick={goToPrevious}
              disabled={isAnimating}
              className="w-12 h-12 border border-background/40 bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 hover:border-background/60 transition-all duration-300 disabled:opacity-40 group"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={goToNext}
              disabled={isAnimating}
              className="w-12 h-12 border border-background/40 bg-background/10 backdrop-blur-sm flex items-center justify-center text-background hover:bg-background/20 hover:border-background/60 transition-all duration-300 disabled:opacity-40 group"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Slide Counter - Editorial Style */}
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
              isAnimating 
                ? 'opacity-0 translate-y-6' 
                : 'opacity-100 translate-y-0'
            }`}
          >
            {/* Trending Label */}
            <span className="inline-block text-[10px] font-medium uppercase tracking-[0.4em] text-muted-foreground mb-8">
              Trending Design
            </span>

            {/* Editorial Title */}
            <h1 className="font-serif text-2xl md:text-3xl lg:text-[2rem] xl:text-[2.5rem] font-medium leading-[1.1] text-foreground mb-6 tracking-tight">
              {currentProduct.name}
            </h1>

            {/* Short Description */}
            <p className="text-muted-foreground text-sm lg:text-base leading-relaxed mb-8 line-clamp-2">
              {currentProduct.description}
            </p>

            {/* Price Display */}
            <div className="flex items-baseline gap-3 mb-10">
              <span className="font-serif text-2xl lg:text-3xl text-foreground">
                ${currentProduct.price}
              </span>
              {currentProduct.originalPrice && (
                <span className="text-base text-muted-foreground/60 line-through">
                  ${currentProduct.originalPrice}
                </span>
              )}
            </div>

            {/* CTA Button - Clean Style */}
            <Button 
              asChild 
              size="lg" 
              className="w-full px-8 py-6 text-xs tracking-[0.15em] uppercase font-medium hover:shadow-lg transition-all duration-300"
            >
              <Link to={`/product/${currentProduct.id}`}>
                View Design
              </Link>
            </Button>

            {/* Category Label */}
            <div className="mt-12">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
                {getCategoryLabel(currentProduct.category)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Bottom Center */}
      <div className="lg:hidden absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-20">
        <button
          onClick={goToPrevious}
          disabled={isAnimating}
          className="w-10 h-10 border border-foreground/20 bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground disabled:opacity-40"
          aria-label="Previous slide"
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
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default HeroEditorial;
