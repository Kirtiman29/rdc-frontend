import { Product } from '@/types/product';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const { addToCart } = useCart();
  const categoryLabel = product.category.replace('-', ' ');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart(product);
    }
  };

  return (
    <div className="group animate-fade-in">
      <Link to={`/product/${product.id}`}>
        <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Premium badge */}
          {product.premium && (
            <span className="absolute left-3 top-3 rounded-sm bg-foreground/90 px-2 py-1 text-xs font-medium uppercase tracking-wider text-background">
              Premium
            </span>
          )}

          {/* Sale badge */}
          {product.originalPrice && (
            <span className="absolute right-3 top-3 rounded-sm bg-destructive px-2 py-1 text-xs font-medium uppercase tracking-wider text-destructive-foreground">
              Sale
            </span>
          )}

          {/* Out of stock overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <span className="font-serif text-sm uppercase tracking-wider text-muted-foreground">
                Out of Stock
              </span>
            </div>
          )}

          {/* Quick add button */}
          {product.inStock && (
            <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-100 md:opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          )}
        </div>
      </Link>

      <div>
        <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
          {categoryLabel}
        </span>
        <Link to={`/product/${product.id}`}>
          <h3 className="mb-2 font-serif text-lg font-medium transition-colors hover:text-muted-foreground">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-medium">${product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
