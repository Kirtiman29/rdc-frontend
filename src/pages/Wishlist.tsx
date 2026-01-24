import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { getFeaturedProducts } from '@/data/products';

const Wishlist = () => {
  // Mock wishlist - using featured products as example
  const wishlistItems = getFeaturedProducts().slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-20">
          {/* Page Header */}
          <div className="mb-12">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Your Account
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Wishlist
            </h1>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-serif text-xl mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Save designs you love for later.
              </p>
              <Button asChild>
                <Link to="/gallery">Browse Designs</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {wishlistItems.map((product) => (
                <div key={product.id} className="group bg-background border border-border">
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Remove Button */}
                      <button 
                        className="absolute top-3 right-3 w-8 h-8 bg-background rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shadow-md"
                        onClick={(e) => {
                          e.preventDefault();
                          // Remove from wishlist logic
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-serif text-base group-hover:text-muted-foreground transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">${product.price}</p>
                    <Button size="sm" className="w-full mt-3">
                      Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
