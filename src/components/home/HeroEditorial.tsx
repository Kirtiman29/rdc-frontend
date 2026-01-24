import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTrendingProducts } from '@/data/products';

const HeroEditorial = () => {
  const trendingProducts = getTrendingProducts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentProduct = trendingProducts[currentIndex] || trendingProducts[0];

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? trendingProducts.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex === trendingProducts.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  if (!currentProduct) return null;

  return (
    <section className="relative min-h-[85vh] bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8 h-full">
        <div className="grid lg:grid-cols-2 min-h-[85vh] gap-8 items-center">
          {/* Left: Image */}
          <div className="relative h-[50vh] lg:h-[75vh] overflow-hidden">
            <div
              className={`absolute inset-0 transition-all duration-500 ${
                isAnimating ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
              }`}
            >
              <img
                src={currentProduct.images[0]}
                alt={currentProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Navigation Arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {trendingProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-foreground w-8' 
                      : 'bg-foreground/30 hover:bg-foreground/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Editorial Text */}
          <div className="flex flex-col justify-center lg:pl-12 py-12 lg:py-0">
            <div
              className={`transition-all duration-500 ${
                isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              }`}
            >
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                Trending Design
              </span>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-4 mb-6 leading-tight">
                {currentProduct.name}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mb-8">
                {currentProduct.description}
              </p>
              <div className="flex items-center gap-6 mb-8">
                <span className="font-serif text-3xl text-foreground">
                  ${currentProduct.price}
                </span>
                {currentProduct.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${currentProduct.originalPrice}
                  </span>
                )}
              </div>
              <Button asChild size="lg" className="px-10">
                <Link to={`/product/${currentProduct.id}`}>
                  View Design
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroEditorial;
