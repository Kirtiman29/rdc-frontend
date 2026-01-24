import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { getEditorsChoice, getFeaturedProducts } from '@/data/products';

const EditorsChoice = () => {
  // Use editors choice or fallback to featured
  const products = getEditorsChoice().length > 0 
    ? getEditorsChoice() 
    : getFeaturedProducts().slice(0, 4);

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Curated Selection
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2">
            Editor's Choice
          </h2>
        </div>

        {/* Editorial Grid Layout */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {products.slice(0, 4).map((product, index) => (
            <div 
              key={product.id} 
              className={`group ${index === 0 ? 'md:row-span-2' : ''}`}
            >
              <Link to={`/product/${product.id}`} className="block h-full">
                <div className={`relative overflow-hidden bg-secondary/30 ${
                  index === 0 ? 'aspect-[3/4] md:h-full' : 'aspect-[4/3]'
                }`}>
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
                  
                  {/* Wishlist Button */}
                  <button 
                    className="absolute top-4 right-4 w-10 h-10 bg-background rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 shadow-md"
                    onClick={(e) => {
                      e.preventDefault();
                      // Add to wishlist logic
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </button>

                  {/* Product Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-foreground/80 to-transparent">
                    <h3 className="font-serif text-xl md:text-2xl text-background">
                      {product.name}
                    </h3>
                    <p className="text-background/80 text-sm mt-1">${product.price}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditorsChoice;
