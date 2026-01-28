import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addToCart as cartApiService } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { getAssetUrl } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import type { Design } from '@/types/product';

interface ProductCardProps {
  product: Design; // ✅ Sync: Using industrial Design type
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isWished, setIsWished] = useState(false);
  const [isWishloading, setIsWishloading] = useState(false);

  // ✅ Sync: Backend uses 'segment' and 'category.name'
  const categoryLabel = product.category?.name || product.segment?.replace('_', ' ') || 'Textile';

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const wished = await checkWishlistStatus(product.id);
        setIsWished(wished);
      } catch (error) {
        console.error('Failed to check wishlist status:', error);
      }
    };
    checkStatus();
  }, [product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await cartApiService(product.id, 1);
      toast({
        title: "Added to Cart",
        description: `${product.title} has been added to your selection.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to add items to your cart.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishloading(true);
    try {
      if (isWished) {
        await removeFromWishlist(product.id);
        setIsWished(false);
        toast({ title: "Removed", description: "Design removed from wishlist." });
      } else {
        await addToWishlist(product.id);
        setIsWished(true);
        toast({ title: "Saved", description: "Design added to wishlist." });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Wishlist Error",
        description: "Authentication required.",
      });
    } finally {
      setIsWishloading(false);
    }
  };

  return (
    <div className="group animate-fade-in relative">
      <Link to={`/product/${product.id}`}>
        <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
          <img
            src={getAssetUrl(product.assetUuid)}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* ✅ FIXED: Vertical Badge Stack (Top-Left) */}
          <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
            {product.premium && (
              <span className="rounded-sm bg-foreground/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-background shadow-sm">
                Premium
              </span>
            )}
            {product.discountPercent > 0 && (
              <span className="rounded-sm bg-destructive px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground shadow-sm">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* ✅ FIXED: Wishlist Button (Top-Right) - Higher Z-Index */}
          <div className="absolute right-3 top-3 z-30">
            <button
              onClick={handleToggleWishlist}
              disabled={isWishloading}
              className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-all backdrop-blur-sm ${
                isWished
                  ? 'bg-destructive text-destructive-foreground scale-110'
                  : 'bg-background/80 text-foreground hover:bg-background hover:scale-110'
              }`}
            >
              {isWishloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${isWished ? 'fill-current' : ''}`} />
              )}
            </button>
          </div>

          {/* Out of stock logic */}
          {!product.active && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80">
              <span className="font-serif text-sm uppercase tracking-wider text-muted-foreground">
                Unavailable
              </span>
            </div>
          )}

          {/* Hover Overlay with Eye Icon */}
          <div className="absolute inset-0 z-10 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
             <div className="rounded-full bg-background/90 p-3 shadow-xl">
                <Eye className="h-5 w-5 text-foreground" />
             </div>
          </div>

          {/* Quick add button */}
          {product.active && (
            <div className="absolute bottom-3 left-3 right-3 z-30 translate-y-2 opacity-100 transition-all duration-300 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
              <Button
                className="w-full gap-2 shadow-xl"
                size="sm"
                disabled={isAdding}
                onClick={handleAddToCart}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
          )}
        </div>
      </Link>

      <div>
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {categoryLabel}
        </span>
        <Link to={`/product/${product.id}`}>
          <h3 className="mb-2 font-serif text-lg font-medium transition-colors hover:text-muted-foreground line-clamp-1">
            {product.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            ₹{(product.finalPriceCents / 100).toLocaleString('en-IN')}
          </span>
          {product.discountPercent > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{(product.basePriceCents / 100).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;