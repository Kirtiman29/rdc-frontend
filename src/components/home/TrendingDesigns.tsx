import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { getTrendingProducts, getFeaturedProducts } from '@/data/products';

const TrendingDesigns = () => {
  // Combine trending and featured for more variety
  const products = [...getTrendingProducts(), ...getFeaturedProducts()].slice(0, 6);

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Most Popular
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Trending Designs
            </h2>
          </div>
          <Link 
            to="/gallery?tag=trending" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            View All →
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="group">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30 mb-4">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
                  
                  {/* Quick Actions */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors shadow-md"
                      onClick={(e) => {
                        e.preventDefault();
                        // Add to wishlist logic
                      }}
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    <button 
                      className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors shadow-md"
                      onClick={(e) => {
                        e.preventDefault();
                        // Quick view logic
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute bottom-4 left-4">
                    <span className="text-xs font-medium uppercase tracking-wider bg-background/90 backdrop-blur-sm px-3 py-1 rounded-sm">
                      {product.tags[0]}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Product Info */}
              <div className="space-y-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-lg text-foreground group-hover:text-muted-foreground transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground">${product.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
          <Link 
            to="/gallery?tag=trending" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View All Trending →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrendingDesigns;
