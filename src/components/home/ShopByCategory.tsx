import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '@/api/designApi';
import { Loader2, ArrowRight } from 'lucide-react';
import type { Category } from '@/types/product';

const ShopByCategory = () => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // ✅ Sync: Fetch real-time categories from Admin Service (Port 8080) 
        const data = await getCategories();
        setDbCategories(data);
      } catch (error) {
        console.error('Failed to sync gallery categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (dbCategories.length === 0) return null;

  // ✅ Logic: Display exactly 9 categories for the 3x3 grid
  const displayedCategories = dbCategories.slice(0, 9);

  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        {/* ✅ Section Header with Top-Right "View All" */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="text-left">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Explore
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2">
              Shop by Category
            </h2>
          </div>
          
          <Link 
            to="/gallery" 
            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            View All Collections
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Category Grid: Clean 3x3 structure */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {displayedCategories.map((category) => (
            <Link 
              key={category.id} 
              to={`/gallery?category=${category.id}`}
              className="group relative aspect-square overflow-hidden bg-background"
            >
              <img
                // ✅ Sync: Backend resolves imageUrl via Asset Service (Port 8090) [cite: 304, 310]
                src={category.imageUrl || 'https://placehold.co/600x600?text=Design+Collection'}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=Category';
                }}
              />
              
              {/* Styling Overlay */}
              <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/40 transition-colors duration-300" />
              
              {/* Category Display Name */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="font-serif text-xl md:text-2xl text-background text-center px-4">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;