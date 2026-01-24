import { Link } from 'react-router-dom';
import { categories } from '@/data/products';

const ShopByCategory = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Explore
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-medium mt-2">
            Shop by Category
          </h2>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              to={`/gallery?category=${category.slug}`}
              className="group relative aspect-square overflow-hidden"
            >
              {/* Background Image */}
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/50 transition-colors duration-300" />
              
              {/* Category Name */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="font-serif text-xl md:text-2xl text-background text-center">
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
