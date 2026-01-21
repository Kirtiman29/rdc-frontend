import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShoppingBag, Heart, Share2, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { getProductById, products } from '@/data/products';
import ProductCard from '@/components/products/ProductCard';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = getProductById(id || '');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 font-serif text-2xl">Product Not Found</h1>
            <Link to="/gallery" className="text-sm underline underline-offset-4">
              Return to Gallery
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const categoryLabel = product.category.replace('-', ' ');

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-secondary/50">
          <div className="container px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link to="/gallery" className="transition-colors hover:text-foreground">
                Collections
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/gallery?category=${product.category}`}
                className="capitalize transition-colors hover:text-foreground"
              >
                {categoryLabel}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Product section */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Image gallery */}
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-sm bg-secondary">
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="flex gap-3">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square w-20 overflow-hidden rounded-sm border-2 transition-colors ${
                          selectedImage === index
                            ? 'border-foreground'
                            : 'border-transparent hover:border-muted-foreground/50'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} view ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="flex flex-col">
                {/* Badges */}
                <div className="mb-4 flex gap-2">
                  {product.premium && (
                    <span className="rounded-sm bg-foreground px-2 py-1 text-xs font-medium uppercase tracking-wider text-background">
                      Premium
                    </span>
                  )}
                  {product.originalPrice && (
                    <span className="rounded-sm bg-destructive px-2 py-1 text-xs font-medium uppercase tracking-wider text-destructive-foreground">
                      Sale
                    </span>
                  )}
                </div>

                <span className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                  {categoryLabel}
                </span>

                <h1 className="mb-4 font-serif text-3xl font-medium md:text-4xl">
                  {product.name}
                </h1>

                {/* Price */}
                <div className="mb-6 flex items-baseline gap-3">
                  <span className="font-serif text-2xl font-medium">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mb-8 leading-relaxed text-muted-foreground">
                  {product.description}
                </p>

                {/* Specifications */}
                {product.specifications && (
                  <div className="mb-8 space-y-3 border-y border-border py-6">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Colors */}
                {product.colors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-medium uppercase tracking-wider">
                      Available Colors
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <span
                          key={color}
                          className="rounded-sm border border-border bg-secondary px-3 py-1 text-sm capitalize"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity selector */}
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wider">Quantity</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-secondary"
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="flex h-10 w-12 items-center justify-center font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-secondary"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add to cart */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    disabled={!product.inStock}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Heart className="h-5 w-5" />
                    <span className="sr-only sm:not-sr-only">Wishlist</span>
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Share2 className="h-5 w-5" />
                    <span className="sr-only sm:not-sr-only">Share</span>
                  </Button>
                </div>

                {/* In stock indicator */}
                {product.inStock && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    In stock and ready to ship
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-border bg-secondary/30 py-12 md:py-16">
            <div className="container px-4">
              <h2 className="mb-8 font-serif text-2xl font-medium">You May Also Like</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
