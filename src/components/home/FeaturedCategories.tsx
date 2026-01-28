import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { getCategories } from '@/api/designApi';
import type { Category } from '@/types/product';

const FeaturedCategories = () => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // ✅ Sync: Fetch real-time categories from isolated public namespace
        const data = await getCategories();
        // Take the first 4 for the featured section
        setDbCategories(data.slice(0, 4));
      } catch (error) {
        console.error('Gallery sync error in component:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Fallback if no categories are found in the database
  if (dbCategories.length === 0) return null;

  return (
    <section className="bg-card py-16 md:py-24">
      <div className="container px-4">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-2 inline-block font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Shop by Category
            </span>
            <h2 className="font-serif text-3xl font-medium md:text-4xl">
              Explore Our Collections
            </h2>
          </div>
          <Link
            to="/gallery"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View All Products
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dbCategories.map((category, index) => (
            <Link
              key={category.id}
              to={`/gallery?category=${category.id}`}
              className="group relative animate-fade-in-up overflow-hidden rounded-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={category.imageUrl || 'https://placehold.co/400x500?text=Collection'}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="mb-1 font-serif text-xl font-medium text-primary-foreground">
                  {category.name}
                </h3>
                <p className="mb-3 text-sm text-primary-foreground/80 line-clamp-2">
                  {category.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-primary-foreground/70 transition-colors group-hover:text-primary-foreground">
                  Browse Collection
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;