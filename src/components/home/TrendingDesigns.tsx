import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingBag, Loader2 } from 'lucide-react';
import { getTrendingDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const TrendingDesigns = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // ✅ Sync: Request strictly 8 trending designs from Admin Service (Port 8080)
        const data = await getTrendingDesigns(8); 
        
        // Safety: ensure we only ever display 8 items for the 4x2 grid
        const limitedData = data.slice(0, 8);
        setProducts(limitedData);

        // ✅ Sync: Check wishlist status for each product from Port 8093
        const statusMap: Record<number, boolean> = {};
        for (const product of limitedData) {
          statusMap[product.id] = await checkWishlistStatus(product.id);
        }
        setWishlistState(statusMap);
      } catch (error) {
        console.error('Failed to sync trending designs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1);
      toast({ 
        title: "Added to Cart", 
        description: `${product.title} has been added to your selection.` 
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
        description: "Your wishlist has been updated." 
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Wishlist Error", 
        description: "You must be logged in to save designs." 
      });
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Most Popular
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Trending Designs
            </h2>
          </div>
          <div className="hidden md:block">
            <Link 
              to="/gallery?trending=true" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View All Collection →
            </Link>
          </div>
        </div>

        {/* ✅ FIXED Layout: 4-column grid (2 rows of 4 = 8 designs maximum) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {products.map((product) => (
            <div key={product.id} className="group animate-fade-in">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30 mb-4">
                  <img
                    src={getAssetUrl(product.assetUuid)}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md ${
                        wishlistState[product.id] ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-secondary'
                      }`}
                      onClick={(e) => toggleWishlist(e, product)}
                    >
                      <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                    </button>
                    <button className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors shadow-md">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-medium uppercase tracking-wider bg-background/90 backdrop-blur-sm px-3 py-1 rounded-sm border border-border">
                      {product.segment?.replace('_', ' ') || 'Textile'}
                    </span>
                  </div>

                  <button 
                    className="absolute bottom-4 left-4 right-4 h-10 bg-foreground text-background rounded-md flex items-center justify-center gap-2 text-sm font-medium opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-foreground/90"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </Link>

              <div className="space-y-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-lg text-foreground group-hover:text-muted-foreground transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-sm font-medium">
                  ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingDesigns;