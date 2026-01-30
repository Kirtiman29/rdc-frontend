import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '@/api/designApi';
import { Loader2, ArrowRight } from 'lucide-react';
import type { Category } from '@/types/product';

const ShopByCategory = () => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Security: Global section right-click restriction
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
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

  const displayedCategories = dbCategories.slice(0, 9);

  return (
    <section className="py-20 md:py-28 bg-secondary/30" onContextMenu={handleContextMenu}>
      <div className="container mx-auto px-4 md:px-8">
        
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

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {displayedCategories.map((category) => (
            <Link 
              key={category.id} 
              to={`/gallery?category=${category.id}`}
              className="group relative aspect-square overflow-hidden bg-background select-none"
            >
              {/* ✅ HIGH-VISIBILITY INDUSTRIAL WATERMARK */}
              {/* Added as a layer above the image (z-10) but below the title text */}
              <div 
                className="absolute inset-0 z-10 pointer-events-none opacity-[0.20]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='16' font-weight='900' fill='none' stroke='white' stroke-width='0.6' text-anchor='middle' transform='rotate(-35 60 60)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat'
                }}
              />

              <img
                src={category.imageUrl || 'https://placehold.co/600x600?text=Design+Collection'}
                alt={category.name}
                draggable={false} // ✅ Security: Prevent drag-to-save
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x600?text=Category';
                }}
              />
              
              {/* Overlay darkening for text readability and watermark contrast */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300 z-10" />
              
              {/* Category Display Name */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <h3 className="font-serif text-xl md:text-2xl text-white text-center px-4 tracking-tight drop-shadow-md">
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