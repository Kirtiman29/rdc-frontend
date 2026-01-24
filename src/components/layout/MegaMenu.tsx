import { useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '@/data/products';

interface MenuItem {
  label: string;
  href: string;
}

interface MenuColumn {
  title: string;
  items: MenuItem[];
}

const menuColumns: MenuColumn[] = [
  {
    title: 'Apparel',
    items: [
      { label: 'Menswear', href: '/gallery?tag=menswear' },
      { label: 'Womenswear', href: '/gallery?tag=womenswear' },
      { label: 'Kidswear', href: '/gallery?tag=kidswear' },
    ],
  },
  {
    title: 'Lifestyle',
    items: [
      { label: 'Home', href: '/gallery?tag=home' },
      { label: 'Interiors', href: '/gallery?tag=interiors' },
    ],
  },
  {
    title: 'Collections',
    items: [
      { label: 'Trending', href: '/gallery?tag=trending' },
      { label: 'New Arrivals', href: '/gallery?tag=new-arrival' },
      { label: "Editor's Choice", href: '/gallery?tag=editors-choice' },
      { label: 'Special Offers', href: '/gallery?tag=special-offer' },
    ],
  },
];

const MegaMenu = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Get the latest design (first product or one matching hovered category)
  const getPreviewProduct = () => {
    if (hoveredItem) {
      const matchingProduct = products.find(p => 
        p.tags.includes(hoveredItem.toLowerCase()) || 
        p.tags.includes(hoveredItem.toLowerCase().replace("'s ", '-'))
      );
      if (matchingProduct) return matchingProduct;
    }
    return products[0];
  };

  const previewProduct = getPreviewProduct();

  return (
    <div className="absolute left-0 top-full w-full bg-background border-b border-border shadow-lg animate-fade-in">
      <div className="container mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Browse All Link */}
          <div className="col-span-2">
            <Link 
              to="/gallery" 
              className="block text-sm font-medium uppercase tracking-widest text-foreground hover:text-muted-foreground transition-colors"
            >
              Browse All Designs
            </Link>
          </div>

          {/* Menu Columns */}
          <div className="col-span-6 grid grid-cols-3 gap-8">
            {menuColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
                  {column.title}
                </h3>
                <ul className="space-y-3">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.href}
                        className="text-sm text-foreground hover:text-muted-foreground transition-colors"
                        onMouseEnter={() => setHoveredItem(item.label)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Preview Card */}
          <div className="col-span-4">
            <div className="bg-secondary/30 p-4 rounded-sm">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                Latest Design
              </p>
              <Link to={`/product/${previewProduct.id}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-sm mb-3">
                  <img
                    src={previewProduct.images[0]}
                    alt={previewProduct.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h4 className="font-serif text-lg text-foreground group-hover:text-muted-foreground transition-colors">
                  {previewProduct.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  ${previewProduct.price}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
