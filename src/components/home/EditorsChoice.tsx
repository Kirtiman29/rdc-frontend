import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getEditorsChoice, getFeaturedProducts } from '@/data/products';
import { useState } from 'react';

const EditorsChoice = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Use editors choice or fallback to featured
  const allProducts = getEditorsChoice().length > 0 
    ? getEditorsChoice() 
    : getFeaturedProducts();
  
  const products = allProducts.slice(0, 5);

  // Card configurations for asymmetric layout
  const cardConfigs = [
    { 
      gridClass: 'md:col-span-2 md:row-span-2', 
      aspectClass: 'aspect-[3/4]',
      isStroke: false 
    },
    { 
      gridClass: 'md:col-span-2 md:row-span-2', 
      aspectClass: 'aspect-square',
      isStroke: false 
    },
    { 
      gridClass: 'md:col-span-3 md:row-span-1', 
      aspectClass: 'aspect-[16/9]',
      isStroke: false 
    },
    { 
      gridClass: 'md:col-span-2 md:row-span-1', 
      aspectClass: 'aspect-[4/3]',
      isStroke: false 
    },
    { 
      gridClass: 'md:col-span-2 md:row-span-1', 
      aspectClass: 'aspect-[3/2]',
      isStroke: true // Last card - stroke style
    },
  ];

  const getCardScale = (index: number) => {
    if (hoveredIndex === null) return 'scale-100';
    if (hoveredIndex === index) return 'scale-[1.02]';
    return 'scale-[0.98]';
  };

  const getCardOpacity = (index: number) => {
    if (hoveredIndex === null) return 'opacity-100';
    if (hoveredIndex === index) return 'opacity-100';
    return 'opacity-70';
  };

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Curated Selection
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium mt-3">
            Editor's Choice
          </h2>
        </div>

        {/* Asymmetric Mosaic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-5">
          {products.map((product, index) => {
            const config = cardConfigs[index] || cardConfigs[cardConfigs.length - 1];
            
            return (
              <div 
                key={product.id} 
                className={`${config.gridClass} transition-all duration-700 ease-in-out ${getCardScale(index)} ${getCardOpacity(index)}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Link 
                  to={`/product/${product.id}`} 
                  className="block h-full cursor-pointer"
                >
                  {config.isStroke ? (
                    // Stroke/Border Style Card (Last Card)
                    <div className={`relative ${config.aspectClass} border-2 border-foreground/20 hover:border-foreground/40 transition-all duration-500 ease-in-out flex flex-col justify-between p-6 md:p-8 group`}>
                      {/* Top Content */}
                      <div className="flex justify-between items-start">
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Editor's Pick
                        </span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      
                      {/* Bottom Content */}
                      <div>
                        <h3 className="font-serif text-xl md:text-2xl text-foreground mb-2">
                          {product.name}
                        </h3>
                        <p className="text-foreground/70 text-sm">
                          ${product.price}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Standard Image Card
                    <div className={`relative ${config.aspectClass} overflow-hidden bg-secondary/30 group`}>
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                      
                      {/* Bottom-left Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                        <h3 className="font-serif text-lg md:text-xl lg:text-2xl text-background mb-1">
                          {product.name}
                        </h3>
                        <p className="text-background/80 text-sm">
                          ${product.price}
                        </p>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EditorsChoice;
