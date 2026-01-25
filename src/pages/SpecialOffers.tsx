import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSpecialOffers } from '@/data/products';

const SpecialOffers = () => {
  const specialOffers = getSpecialOffers();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Limited Time
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-4 mb-6 text-foreground">
              Special Offers
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Exceptional designs at exclusive prices. 
              Premium quality patterns with savings that matter.
            </p>
          </div>
        </section>

        {/* Grid Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {specialOffers.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-background rounded-sm overflow-hidden border border-border hover:border-muted-foreground/30 transition-colors"
                >
                  {/* Sale Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-1 bg-foreground text-background text-[10px] font-medium uppercase tracking-wider">
                      {product.originalPrice && 
                        `${Math.round((1 - product.price / product.originalPrice) * 100)}% Off`
                      }
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Add to wishlist"
                  >
                    <Heart className="h-4 w-4" />
                  </button>

                  {/* Image */}
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-background text-foreground text-xs font-medium uppercase tracking-wider">
                        <Eye className="h-3 w-3" />
                        Quick View
                      </span>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      {product.tags[0]}
                    </p>
                    <h3 className="font-serif text-xl text-foreground mb-3">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-xl text-foreground">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-muted-foreground line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {specialOffers.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg mb-4">
                  No special offers available at the moment.
                </p>
                <Link
                  to="/gallery"
                  className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium uppercase tracking-wider hover:bg-foreground/90 transition-colors"
                >
                  Browse All Designs
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-4">
              Never Miss an Offer
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Subscribe to receive exclusive discounts and early access to special offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button className="px-6 h-12 bg-foreground text-background text-sm font-medium uppercase tracking-wider hover:bg-foreground/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SpecialOffers;
