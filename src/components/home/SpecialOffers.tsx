import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { getSpecialOffers, products } from '@/data/products';

const SpecialOffers = () => {
  // Use special offers or fallback to products with originalPrice
  const offerProducts = getSpecialOffers().length > 0 
    ? getSpecialOffers() 
    : products.filter(p => p.originalPrice).slice(0, 4);

  return (
    <section className="py-20 md:py-28 bg-secondary/20">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-destructive">
              Limited Time
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Special Offers
            </h2>
          </div>
          <Link 
            to="/gallery?tag=special-offer" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            View All Offers →
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {offerProducts.slice(0, 4).map((product) => (
            <div key={product.id} className="group">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30 mb-4 border border-destructive/20">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Sale Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-medium uppercase tracking-wider bg-destructive text-destructive-foreground px-3 py-1">
                      Sale
                    </span>
                  </div>

                  {/* Discount Percentage */}
                  {product.originalPrice && (
                    <div className="absolute bottom-4 left-4">
                      <span className="text-xs font-medium uppercase tracking-wider bg-background/90 backdrop-blur-sm px-3 py-1 rounded-sm">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% Off
                      </span>
                    </div>
                  )}

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

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
                </div>
              </Link>

              {/* Product Info */}
              <div className="space-y-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-lg text-foreground group-hover:text-muted-foreground transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-destructive">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
          <Link 
            to="/gallery?tag=special-offer" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View All Offers →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;
