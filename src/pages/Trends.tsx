import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, Loader2, ShoppingBag } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getTrendingDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const Trends = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        // ✅ Sync: Fetch real-time trending designs from Admin Service (Port 8080)
        // Fetches a larger set (24) for the main trends page
        const data = await getTrendingDesigns(24);
        setProducts(data);

        // ✅ Sync: Check wishlist status for each product via Port 8093
        const statusMap: Record<number, boolean> = {};
        for (const product of data) {
          statusMap[product.id] = await checkWishlistStatus(product.id);
        }
        setWishlistState(statusMap);
      } catch (error) {
        console.error('Failed to sync trending collection:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1);
      toast({ 
        title: "Added to Cart", 
        description: `${product.title} has been added.` 
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Cart Error", 
        description: "Please login to manage your cart." 
      });
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
    const isWished = wishlistState[product.id];
    try {
      if (isWished) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
      setWishlistState(prev => ({ ...prev, [product.id]: !isWished }));
      toast({ 
        title: isWished ? "Removed" : "Saved", 
        description: "Your selection has been updated." 
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Authentication required." 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              What's Hot
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-4 mb-6">
              Trending Designs
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Discover the patterns making waves in the industry. 
              Curated from our most sought-after designs this season.
            </p>
          </div>
        </section>

        {/* Grid Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group relative bg-background rounded-sm overflow-hidden border border-border/50"
                >
                  {/* Action Buttons Overlay (Upper Right) */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => toggleWishlist(e, product)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all shadow-sm ${
                        wishlistState[product.id] ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-muted-foreground hover:text-foreground'
                      }`}
                      aria-label="Toggle wishlist"
                    >
                      <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                    </button>
                    <Link 
                      to={`/product/${product.id}`}
                      className="w-9 h-9 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Image resolved via Asset Service (Port 8090) */}
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-[3/4] overflow-hidden bg-secondary/30">
                      <img
                        src={getAssetUrl(product.assetUuid)}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  {/* Info & Add to Cart */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                        {product.segment?.replace('_', ' ') || 'Textile'}
                      </p>
                      <h3 className="font-serif text-md text-foreground line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="font-serif text-lg text-foreground mt-1">
                        ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button 
                      className="w-full h-10 bg-foreground text-background text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {products.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No trending designs found.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Trends;