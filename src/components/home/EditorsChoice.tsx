import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Loader2 } from 'lucide-react';
import { getEditorsPick } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import { addToCart } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { useToast } from '@/components/ui/use-toast';
import type { Design } from '@/types/product';

const EditorsChoice = () => {
  const [products, setProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistState, setWishlistState] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        // ✅ Sync: Fetch real-time editor picks from Admin Service (Port 8080)
        // Requesting 8 to 10 designs as requested to create a balanced grid
        const data = await getEditorsPick(8);
        setProducts(data);

        // ✅ Sync: Check wishlist status for each product from Port 8093
        const statusMap: Record<number, boolean> = {};
        for (const product of data) {
          statusMap[product.id] = await checkWishlistStatus(product.id);
        }
        setWishlistState(statusMap);
      } catch (error) {
        console.error('Failed to sync editor picks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPicks();
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, product: Design) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // ✅ Sync: Direct integration with Cart Service (Port 8091)
      await addToCart(product.id, 1);
      toast({ title: "Added to Cart", description: `${product.title} is now in your bag.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Cart Error", description: "Please login to add items." });
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
      toast({ title: isWished ? "Removed" : "Saved", description: "Your wishlist has been updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Wishlist Error", description: "Authentication required." });
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
              Curated Selection
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Editor's Choice
            </h2>
          </div>
          <Link 
            to="/gallery" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            Explore All →
          </Link>
        </div>

        {/* ✅ FIXED: Clean 4-column grid (Industrial standard for 8-10 items) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="group">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30 mb-4">
                  <img
                    // ✅ Sync: Resolved via Asset Service (Port 8090)
                    src={getAssetUrl(product.assetUuid)}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-foreground text-background px-3 py-1">
                      Featured
                    </span>
                  </div>

                  <button 
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md ${
                      wishlistState[product.id] ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                    }`}
                    onClick={(e) => toggleWishlist(e, product)}
                  >
                    <Heart className={`h-4 w-4 ${wishlistState[product.id] ? 'fill-current' : ''}`} />
                  </button>

                  <button 
                    className="absolute bottom-4 left-4 right-4 h-10 bg-foreground text-background rounded-md flex items-center justify-center gap-2 text-sm font-medium opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-foreground/90"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </button>

                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 pointer-events-none" />
                </div>
              </Link>

              <div className="space-y-1 px-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-lg text-foreground group-hover:text-muted-foreground transition-colors line-clamp-1">
                    {product.title}
                  </h3>
                </Link>
                {/* ✅ Sync: Industrial Price Rendering (Paise to Rupees) */}
                <p className="text-sm text-muted-foreground">
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

export default EditorsChoice;