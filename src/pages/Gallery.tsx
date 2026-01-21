import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import { ProductFilters, FilterContent } from '@/components/products/ProductFilters';
import { products, categories } from '@/data/products';
import { Product, ProductFilter } from '@/types/product';

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [filters, setFilters] = useState<ProductFilter>({
    category: initialCategory ? [initialCategory] : undefined,
    sortBy: 'newest',
  });

  // Update filters when URL params change
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setFilters((prev) => ({
        ...prev,
        category: [category],
      }));
    }
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (filters.category && filters.category.length > 0) {
      result = result.filter((p) => filters.category!.includes(p.category));
    }

    // Filter by price range
    if (filters.priceRange) {
      result = result.filter(
        (p) => p.price >= filters.priceRange![0] && p.price <= filters.priceRange![1]
      );
    }

    // Filter by availability
    if (filters.inStock) {
      result = result.filter((p) => p.inStock);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        // Assuming products array is already in newest-first order
        break;
    }

    return result;
  }, [filters]);

  const currentCategory = filters.category?.length === 1
    ? categories.find((c) => c.slug === filters.category![0])
    : null;

  const handleAddToCart = (product: Product) => {
    console.log('Add to cart:', product);
    // Cart logic will be implemented
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero banner */}
        <section className="bg-secondary py-12 md:py-16">
          <div className="container px-4">
            {/* Breadcrumb */}
            <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">
                {currentCategory ? currentCategory.name : 'All Collections'}
              </span>
            </nav>

            <h1 className="font-serif text-3xl font-medium md:text-4xl lg:text-5xl">
              {currentCategory ? currentCategory.name : 'All Collections'}
            </h1>
            {currentCategory && (
              <p className="mt-4 max-w-2xl text-muted-foreground">
                {currentCategory.description}
              </p>
            )}
          </div>
        </section>

        {/* Products section */}
        <section className="py-12 md:py-16">
          <div className="container px-4">
            <div className="flex gap-12">
              {/* Desktop Sidebar Filters */}
              <aside className="hidden w-64 shrink-0 lg:block">
                <h2 className="mb-6 font-serif text-lg font-medium">Filters</h2>
                <FilterContent filters={filters} onFiltersChange={setFilters} />
              </aside>

              {/* Products Grid */}
              <div className="flex-1">
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  productCount={filteredProducts.length}
                />

                {filteredProducts.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="font-serif text-xl text-muted-foreground">
                      No products found matching your criteria.
                    </p>
                    <button
                      onClick={() => setFilters({ sortBy: 'newest' })}
                      className="mt-4 text-sm underline underline-offset-4 hover:text-muted-foreground"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
