import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { getPremiumProducts } from '@/data/products';

const PremiumDesigns = () => {
  const premiumProducts = getPremiumProducts().slice(0, 3);

  return (
    <section className="py-20 md:py-28 bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a962]">
              Exclusive Collection
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2 text-white">
              Premium Designs
            </h2>
          </div>
          <Link 
            to="/gallery?filter=premium" 
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors hidden md:block"
          >
            View Collection →
          </Link>
        </div>

        {/* Premium Grid - Larger Cards, More Spacing */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          {premiumProducts.map((product) => (
            <div key={product.id} className="group">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-800 mb-6">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Gold Accent Border on Hover */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#c9a962]/50 transition-colors duration-300" />
                  
                  {/* Premium Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-medium uppercase tracking-wider bg-[#c9a962] text-[#1a1a1a] px-3 py-1.5">
                      Premium
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button 
                    className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      // Add to wishlist logic
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
              </Link>

              {/* Product Info */}
              <div className="space-y-2">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-xl text-white group-hover:text-[#c9a962] transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-neutral-400 line-clamp-2">
                  {product.description}
                </p>
                <p className="text-lg text-[#c9a962] font-medium">${product.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-10 text-center md:hidden">
          <Link 
            to="/gallery?filter=premium" 
            className="text-sm font-medium text-[#c9a962] hover:text-white transition-colors"
          >
            View Premium Collection →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PremiumDesigns;
