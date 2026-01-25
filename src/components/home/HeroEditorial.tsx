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

  // Get category display name
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
    <section className="relative min-h-[90vh] lg:min-h-[85vh] bg-background overflow-hidden">
      {/* Main Container */}
      <div className="h-full min-h-[90vh] lg:min-h-[85vh]">
        <div className="grid lg:grid-cols-12 min-h-[90vh] lg:min-h-[85vh]">
          
          {/* Left: Editorial Image (70%) */}
          <div className="relative lg:col-span-8 h-[50vh] lg:h-auto overflow-hidden order-1">
            {/* Soft overlay for editorial feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/5 via-transparent to-background/10 z-10 pointer-events-none" />
            
            {/* Image Container with animation */}
            <div
              className={`absolute inset-0 transition-all duration-[800ms] ease-out ${
                isAnimating 
                  ? `opacity-0 ${direction === 'right' ? '-translate-x-4' : 'translate-x-4'} scale-[1.02]` 
                  : 'opacity-100 translate-x-0 scale-100'
              }`}
            >
              <div className="relative w-full h-full group">
                <img
                  src={currentProduct.images[0]}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03] filter saturate-[0.9] contrast-[1.02]"
                />
                {/* Subtle vignette effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5 pointer-events-none" />
              </div>
            </div>

            {/* Navigation Arrows - Desktop */}
            <div className="absolute bottom-8 left-8 hidden lg:flex items-center gap-3 z-20">
              <button
                onClick={goToPrevious}
                disabled={isAnimating}
                className="w-14 h-14 bg-background/95 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background hover:shadow-lg transition-all duration-300 disabled:opacity-50 group"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={goToNext}
                disabled={isAnimating}
                className="w-14 h-14 bg-background/95 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background hover:shadow-lg transition-all duration-300 disabled:opacity-50 group"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Slide Counter */}
            <div className="absolute bottom-8 right-8 flex items-center gap-3 z-20">
              <div className="bg-background/95 backdrop-blur-sm px-5 py-3 shadow-sm">
                <span className="font-serif text-xl tracking-wide text-foreground">{formatNumber(currentIndex + 1)}</span>
                <span className="mx-2 text-muted-foreground/60">/</span>
                <span className="text-muted-foreground text-sm">{formatNumber(totalSlides)}</span>
              </div>
            </div>
          </div>

          {/* Right: Content Panel (30%) */}
          <div className="lg:col-span-4 flex flex-col justify-center bg-background px-6 py-10 lg:px-12 lg:py-16 order-2 border-l border-border/30">
            <div
              className={`transition-all duration-700 delay-100 ${
                isAnimating 
                  ? 'opacity-0 translate-y-8' 
                  : 'opacity-100 translate-y-0'
              }`}
            >
              {/* Label */}
              <span className="inline-block text-[11px] font-medium uppercase tracking-[0.35em] text-muted-foreground mb-6 pb-3 border-b border-border/50">
                Trending Design
              </span>

              {/* Title */}
              <h1 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] text-foreground mb-5 tracking-tight">
                {currentProduct.name}
              </h1>

              {/* Description */}
              <p className="text-muted-foreground text-base leading-relaxed mb-8 line-clamp-2 max-w-md">
                {currentProduct.description}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-8">
                <span className="font-serif text-3xl lg:text-4xl text-foreground tracking-tight">
                  ${currentProduct.price}
                </span>
                {currentProduct.originalPrice && (
                  <span className="text-lg text-muted-foreground/70 line-through">
                    ${currentProduct.originalPrice}
                  </span>
                )}
              </div>

              {/* CTA Button */}
              <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto px-12 py-6 text-sm tracking-wide font-medium shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Link to={`/product/${currentProduct.id}`}>
                  View Design
                </Link>
              </Button>

              {/* Category Label */}
              <div className="mt-10 pt-6 border-t border-border/30">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                  {getCategoryLabel(currentProduct.category)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
        <button
          onClick={goToPrevious}
          disabled={isAnimating}
          className="w-12 h-12 bg-background/95 backdrop-blur-sm flex items-center justify-center text-foreground shadow-md disabled:opacity-50"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="bg-background/95 backdrop-blur-sm px-4 py-2 shadow-sm">
          <span className="font-serif text-lg">{formatNumber(currentIndex + 1)}</span>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-muted-foreground text-sm">{formatNumber(totalSlides)}</span>
        </div>
        <button
          onClick={goToNext}
          disabled={isAnimating}
          className="w-12 h-12 bg-background/95 backdrop-blur-sm flex items-center justify-center text-foreground shadow-md disabled:opacity-50"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};

export default HeroEditorial;
