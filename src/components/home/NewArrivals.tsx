import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { getNewArrivals, products } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/types/product';

const NewArrivals = () => {
  const { addToCart } = useCart();
  
  // Use new arrivals or fallback to first 4 products
  const newProducts = getNewArrivals().length > 0 
    ? getNewArrivals() 
    : products.slice(0, 4);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Just Arrived
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              New Arrivals
            </h2>
          </div>
          <Link 
            to="/gallery?tag=new-arrival" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            View All →
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {newProducts.slice(0, 4).map((product) => (
            <div key={product.id} className="group">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30 mb-4">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* New Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-medium uppercase tracking-wider bg-foreground text-background px-3 py-1">
                      New
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button 
                    className="absolute top-4 right-4 w-10 h-10 bg-background rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 shadow-md"
                    onClick={(e) => {
                      e.preventDefault();
                      // Add to wishlist logic
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </button>

                  {/* Add to Cart Button */}
                  <button 
                    className="absolute bottom-4 left-4 right-4 h-10 bg-foreground text-background rounded-md flex items-center justify-center gap-2 text-sm font-medium opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-foreground/90"
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add to Cart
                  </button>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 pointer-events-none" />
                </div>
              </Link>

              {/* Product Info */}
              <div className="space-y-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-serif text-lg text-foreground group-hover:text-muted-foreground transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground">${product.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
          <Link 
            to="/gallery?tag=new-arrival" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View All New Arrivals →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
