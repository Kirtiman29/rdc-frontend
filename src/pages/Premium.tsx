import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getPremiumProducts } from '@/data/products';

const Premium = () => {
  const premiumProducts = getPremiumProducts();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-[#1a1a1a]">
        {/* Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#c9a96e]">
              Exclusive Collection
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-4 mb-6 text-white">
              Premium Designs
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              High-value textile patterns crafted for luxury brands. 
              Each design represents the pinnacle of artistic excellence.
            </p>
          </div>
        </section>

        {/* Premium Grid */}
        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {premiumProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-[#252525] rounded-sm overflow-hidden"
                >
                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 bg-[#c9a96e] text-[#1a1a1a] text-xs font-medium uppercase tracking-wider">
                      Premium
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
                    aria-label="Add to wishlist"
                  >
                    <Heart className="h-5 w-5" />
                  </button>

                  {/* Image */}
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-[3/4] overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <span className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#1a1a1a] text-sm font-medium uppercase tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <Eye className="h-4 w-4" />
                        View Design
                      </span>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-6">
                    <h3 className="font-serif text-xl text-white mb-2">
                      {product.name}
                    </h3>
                    <p className="text-white/50 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-2xl text-[#c9a96e]">
                        ${product.price}
                      </span>
                      <span className="text-xs text-white/40 uppercase tracking-wider">
                        Exclusive License
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 border-t border-white/10">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <p className="text-white/60 mb-4">
              Looking for something unique?
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-3 border border-[#c9a96e] text-[#c9a96e] text-sm font-medium uppercase tracking-wider hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all"
            >
              Request Custom Design
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Premium;
