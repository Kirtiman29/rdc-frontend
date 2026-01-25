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
  const totalSlides = trendingProducts.length;

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? totalSlides - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex === totalSlides - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  if (!currentProduct) return null;

  // Format slide number with leading zero
  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <section className="relative min-h-[85vh] bg-secondary/20">
      <div className="container mx-auto px-4 md:px-8 h-full">
        <div className="grid lg:grid-cols-12 min-h-[85vh] gap-0 items-stretch">
          {/* Left: Image (70%) */}
          <div className="relative lg:col-span-8 h-[50vh] lg:h-auto overflow-hidden">
            <div
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                isAnimating ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'
              }`}
            >
              <img
                src={currentProduct.images[0]}
                alt={currentProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Navigation Arrows */}
            <div className="absolute bottom-8 left-8 flex items-center gap-3">
              <button
                onClick={goToPrevious}
                className="w-12 h-12 bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="w-12 h-12 bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Slide Counter */}
            <div className="absolute bottom-8 right-8 flex items-center gap-2 text-foreground bg-background/90 backdrop-blur-sm px-4 py-2">
              <span className="font-serif text-lg">{formatNumber(currentIndex + 1)}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{formatNumber(totalSlides)}</span>
            </div>
          </div>

          {/* Right: Editorial Text (30%) */}
          <div className="lg:col-span-4 flex flex-col justify-center bg-background p-8 lg:p-12">
            <div
              className={`transition-all duration-700 delay-100 ${
                isAnimating ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
              }`}
            >
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                Trending Design
              </span>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium mt-4 mb-6 leading-tight text-foreground">
                {currentProduct.name}
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 line-clamp-3">
                {currentProduct.description}
              </p>
              <div className="flex items-center gap-4 mb-8">
                <span className="font-serif text-3xl text-foreground">
                  ${currentProduct.price}
                </span>
                {currentProduct.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${currentProduct.originalPrice}
                  </span>
                )}
              </div>
              <Button asChild size="lg" className="w-full sm:w-auto px-10">
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
