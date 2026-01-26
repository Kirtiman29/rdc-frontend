import { Link } from 'react-router-dom';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFeaturedProducts } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/types/product';

const FeaturedProducts = () => {
  const { addToCart } = useCart();
  const featuredProducts = getFeaturedProducts().slice(0, 4);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container px-4">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 inline-block font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Curated Selection
            </span>
            <h2 className="font-serif text-3xl font-medium md:text-4xl">
              Featured Designs
            </h2>
          </div>
          <Link
            to="/gallery"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View All
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className="group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
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

                  {/* Quick add button */}
                  <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-100 md:opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Button
                      className="w-full gap-2"
                      size="sm"
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Link>

              <div>
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  {product.category.replace('-', ' ')}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
