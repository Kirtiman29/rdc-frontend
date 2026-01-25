import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getTrendingProducts, products } from '@/data/products';

const Trends = () => {
  // Get trending products plus some featured ones for a fuller grid
  const trendingProducts = getTrendingProducts();
  const featuredProducts = products.filter(p => p.featured && !p.tags.includes('trending'));
  const allTrending = [...trendingProducts, ...featuredProducts];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              What's Hot
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-4 mb-6 text-foreground">
              Trending Designs
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Discover the patterns making waves in the textile industry. 
              Curated from the most sought-after designs this season.
            </p>
          </div>
        </section>

        {/* Grid Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {allTrending.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-background rounded-sm overflow-hidden border border-border/50"
                >
                  {/* Trending Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-1 bg-foreground text-background text-[10px] font-medium uppercase tracking-wider">
                      Trending
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
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {product.tags[0]}
                    </p>
                    <h3 className="font-serif text-lg text-foreground mb-2">
                      {product.name}
                    </h3>
                    <span className="font-serif text-lg text-foreground">
                      ${product.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More - Pagination Ready */}
            <div className="mt-16 text-center">
              <button className="px-8 py-3 border border-border text-foreground text-sm font-medium uppercase tracking-wider hover:bg-secondary transition-colors">
                Load More Designs
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Trends;
