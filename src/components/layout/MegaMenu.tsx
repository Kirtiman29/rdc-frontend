import { useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '@/data/products';

interface MenuItem {
  label: string;
  href: string;
  tag?: string;
}

interface MenuColumn {
  title: string;
  items: MenuItem[];
}

const menuColumns: MenuColumn[] = [
  {
    title: 'Apparel',
    items: [
      { label: 'Menswear', href: '/gallery?tag=menswear', tag: 'menswear' },
      { label: 'Womenswear', href: '/gallery?tag=womenswear', tag: 'womenswear' },
      { label: 'Kidswear', href: '/gallery?tag=kidswear', tag: 'kidswear' },
    ],
  },
  {
    title: 'Collections',
    items: [
      { label: 'Trending', href: '/trends', tag: 'trending' },
      { label: 'New Arrivals', href: '/gallery?tag=new-arrival', tag: 'new-arrival' },
      { label: "Editor's Choice", href: '/gallery?tag=editors-choice', tag: 'editors-choice' },
      { label: 'Special Offers', href: '/special-offers', tag: 'special-offer' },
    ],
  },
];

const MegaMenu = () => {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  
  // Get preview product based on hovered item or show latest
  const getPreviewProduct = () => {
    if (hoveredTag) {
      const matchingProduct = products.find(p => 
        p.tags.some(t => t.toLowerCase().includes(hoveredTag.toLowerCase()))
      );
      if (matchingProduct) return matchingProduct;
    }
    // Default to first product (latest)
    return products[0];
  };

  const previewProduct = getPreviewProduct();

  return (
    <div className="absolute left-0 top-full w-screen bg-background border-b border-border shadow-lg animate-fade-in" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
      <div className="container mx-auto px-8 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Browse All Link */}
          <div className="col-span-2">
            <Link 
              to="/gallery" 
              className="inline-block text-sm font-medium uppercase tracking-widest text-foreground hover:text-muted-foreground transition-colors pb-1 border-b border-foreground"
            >
              Browse All Designs
            </Link>
          </div>

          {/* Menu Columns */}
          <div className="col-span-6 grid grid-cols-2 gap-12">
            {menuColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-5">
                  {column.title}
                </h3>
                <ul className="space-y-3">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.href}
                        className="text-sm text-foreground hover:text-muted-foreground transition-colors"
                        onMouseEnter={() => setHoveredTag(item.tag || null)}
                        onMouseLeave={() => setHoveredTag(null)}
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
            <div className="bg-secondary/50 p-5 rounded-sm">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Latest Design
              </p>
              <Link to={`/product/${previewProduct.id}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-sm mb-4">
                  <img
                    src={previewProduct.images[0]}
                    alt={previewProduct.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h4 className="font-serif text-lg text-foreground group-hover:text-muted-foreground transition-colors">
                  {previewProduct.name}
                </h4>
                <p className="font-serif text-base text-muted-foreground mt-1">
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
