import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';
import { Loader2 } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  tag?: string;
  category?: string; // To match segments like MENSWEAR
}

interface MenuColumn {
  title: string;
  items: MenuItem[];
}

const menuColumns: MenuColumn[] = [
  {
    title: 'Apparel',
    items: [
      { label: 'Menswear', href: '/gallery?tag=menswear', tag: 'menswear', category: 'MENSWEAR' },
      { label: 'Womenswear', href: '/gallery?tag=womenswear', tag: 'womenswear', category: 'WOMENSWEAR' },
      { label: 'Kidswear', href: '/gallery?tag=kidswear', tag: 'kidswear', category: 'KIDSWEAR' },
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
  const [designs, setDesigns] = useState<Design[]>([]);
  const [hoveredItem, setHoveredItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Industrial Sync: Fetch latest designs from Admin Service (Port 8080)
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await getDesigns({ limit: 50 });
        // Handle both List and Page responses
        const data = Array.isArray(response) ? response : (response.content || []);
        setDesigns(data);
      } catch (error) {
        console.error('MegaMenu sync failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  // ✅ Logic: Find the latest design matching the hovered category or tag
  const getPreviewProduct = (): Design | null => {
    if (!designs.length) return null;

    if (hoveredItem) {
      // 1. Try matching by Segment (MENSWEAR, etc)
      if (hoveredItem.category) {
        const match = designs.find(d => d.segment === hoveredItem.category);
        if (match) return match;
      }
      // 2. Try matching by Flag (Trending, Special Offer)
      if (hoveredItem.tag === 'trending') return designs.find(d => d.trending) || designs[0];
      if (hoveredItem.tag === 'special-offer') return designs.find(d => d.specialOffer) || designs[0];
      
      // 3. Try matching by Title/Tags
      const search = hoveredItem.label.toLowerCase();
      const match = designs.find(d => 
        d.title.toLowerCase().includes(search) || 
        d.tags?.some(t => t.toLowerCase().includes(search))
      );
      if (match) return match;
    }

    return designs[0]; // Default to latest
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
                        onMouseEnter={() => setHoveredItem(item)}
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
            <div className="bg-secondary/50 p-5 rounded-sm min-h-[300px] flex flex-col justify-center">
              {loading ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : previewProduct ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">
                    {hoveredItem ? `Latest in ${hoveredItem.label}` : 'Latest Design'}
                  </p>
                  <Link to={`/product/${previewProduct.id}`} className="group block">
                    <div className="aspect-[4/3] overflow-hidden rounded-sm mb-4 bg-secondary/30">
                      <img
                        // ✅ Resolved via Asset Service (Port 8090) using assetUuid
                        src={getAssetUrl(previewProduct.assetUuid)}
                        alt={previewProduct.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <h4 className="font-serif text-lg text-foreground group-hover:text-muted-foreground transition-colors truncate">
                      {previewProduct.title}
                    </h4>
                    <p className="font-serif text-base text-muted-foreground mt-1">
                      ₹{(previewProduct.finalPriceCents / 100).toLocaleString('en-IN')}
                    </p>
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No designs found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;