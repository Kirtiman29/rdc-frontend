// src/components/products/ProductCard.tsx
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addToCart as cartApiService } from '@/api/cartApi';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '@/api/wishlistApi';
import { getAssetUrl } from '@/api/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Design } from '@/types/product';
// ✅ Import the price utility
import { formatPrice } from '@/utils/price';

interface ProductCardProps {
  product: Design;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isWished, setIsWished] = useState(false);
  const [isWishloading, setIsWishloading] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const categoryLabel = product.category?.name || product.segment?.replace('_', ' ') || 'Textile';

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const wished = await checkWishlistStatus(product.id);
        if (isMounted) setIsWished(wished);
      } catch (error) {
        console.warn('Wishlist sync unavailable');
      }
    };
    checkStatus();
    return () => { isMounted = false; };
  }, [product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await cartApiService(product.id, 1);
      toast({ title: "Added to Cart", description: `${product.title} added.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Cart Error", description: "Please login to add items." });
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
      toast({ variant: "destructive", title: "Wishlist Error", description: "Authentication required." });
    } finally {
      setIsWishloading(false);
    }
  };

  return (
    <div className="group animate-fade-in relative font-sans" onContextMenu={handleContextMenu}>
      <Link to={`/product/${product.id}`}>
        <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-sm bg-secondary select-none shadow-sm">
          
          {/* RDC WATERMARK OVERLAY */}
          <div 
            className="absolute inset-0 z-10 pointer-events-none opacity-[0.20]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='18' font-weight='900' fill='none' stroke='white' stroke-width='0.7' text-anchor='middle' transform='rotate(-35 50 50)'%3ERDC%3C/text%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          />

          <img
            src={getAssetUrl(product.assetUuid)}
            alt={product.title}
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
            {product.luxury && (
              <span className="rounded-sm bg-[#2A2623] px-2 py-1 text-[10px] font-bold uppercase text-white shadow-sm">
                Luxury
              </span>
            )}
            {product.discountPercent > 0 && (
              <span className="rounded-sm bg-destructive px-2 py-1 text-[10px] font-bold uppercase text-white shadow-sm">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="absolute right-3 top-3 z-30 flex flex-col gap-2 translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <button
              onClick={handleToggleWishlist}
              disabled={isWishloading}
              className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-all backdrop-blur-md ${
                isWished ? 'bg-destructive text-white' : 'bg-white/90 text-[#2A2623] hover:bg-white'
              }`}
            >
              {isWishloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${isWished ? 'fill-current' : ''}`} />}
            </button>
            
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#2A2623] shadow-lg backdrop-blur-md hover:bg-white transition-all">
              <Eye className="h-4 w-4" />
            </div>
          </div>

          {!product.active && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unavailable</span>
            </div>
          )}

          {product.active && (
            <div className="absolute bottom-3 left-3 right-3 z-30 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <Button
                className="w-full gap-2 shadow-xl bg-[#2A2623] hover:bg-black uppercase text-[10px] font-bold tracking-widest h-10 rounded-sm"
                size="sm"
                disabled={isAdding}
                onClick={handleAddToCart}
              >
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                Add to Cart
              </Button>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      </Link>

      <div className="px-1">
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {categoryLabel}
        </span>
        <Link to={`/product/${product.id}`}>
          <h3 className="mb-1 font-serif text-lg font-medium transition-colors hover:text-muted-foreground line-clamp-1 text-[#2A2623]">
            {product.title}
          </h3>
        </Link>
        
        {/* ✅ Price Display Refactored for Whole Rupees */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#2A2623]">
            {formatPrice(product.finalPriceCents)}
          </span>
          {product.discountPercent > 0 && (
            <span className="text-xs text-muted-foreground line-through font-light">
              {formatPrice(product.basePriceCents)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;