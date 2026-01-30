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
  category?: string;
}

interface MenuColumn {
  title: string;
  items: MenuItem[];
}

const menuColumns: MenuColumn[] = [
  {
    title: 'Apparel',
    items: [
      { label: 'Menswear', href: '/gallery?segment=MENSWEAR', tag: 'menswear', category: 'MENSWEAR' },
      { label: 'Womenswear', href: '/gallery?segment=WOMENSWEAR', tag: 'womenswear', category: 'WOMENSWEAR' },
      { label: 'Kidswear', href: '/gallery?segment=KIDSWEAR', tag: 'kidswear', category: 'KIDSWEAR' },
    ],
  },
  {
    title: 'Collections',
    items: [
      { label: 'Trending', href: '/gallery?trending=true', tag: 'trending' },
      { label: 'New Arrivals', href: '/gallery?newArrival=true', tag: 'new-arrival' },
      { label: "Editor's Choice", href: '/gallery?editorsPick=true', tag: 'editors-choice' },
      { label: 'Special Offers', href: '/gallery?specialOffer=true', tag: 'special-offer' },
    ],
  },
];

const MegaMenu = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [hoveredItem, setHoveredItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Security: Restrict Right-Click on MegaMenu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await getDesigns({ limit: 50 });
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

  const getPreviewProduct = (): Design | null => {
    if (!designs.length) return null;
    if (hoveredItem) {
      if (hoveredItem.category) {
        const match = designs.find(d => d.segment === hoveredItem.category);
        if (match) return match;
      }
      if (hoveredItem.tag === 'trending') return designs.find(d => d.trending) || designs[0];
      if (hoveredItem.tag === 'special-offer') return designs.find(d => d.specialOffer) || designs[0];
      
      const search = hoveredItem.label.toLowerCase();
      const match = designs.find(d => 
        d.title.toLowerCase().includes(search) || 
        d.tags?.some(t => t.toLowerCase().includes(search))
      );
      if (match) return match;
    }
    return designs[0];
  };

  const previewProduct = getPreviewProduct();

  return (
    <div 
      className="absolute left-0 top-full w-screen bg-white border-b border-slate-200 shadow-2xl animate-fade-in z-[100]" 
      style={{ marginLeft: 'calc(-50vw + 50%)' }}
      onContextMenu={handleContextMenu}
    >
      <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-12 gap-12">
          
          {/* Browse Navigation */}
          <div className="col-span-2">
            <Link 
              to="/gallery" 
              className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#2A2623] hover:opacity-60 transition-all pb-1 border-b-2 border-[#2A2623]"
            >
              Archive Catalog
            </Link>
            <p className="mt-4 text-[10px] text-slate-400 font-medium leading-relaxed">
              Access the complete RDC industrial textile design repository.
            </p>
          </div>

          {/* Categories/Collections */}
          <div className="col-span-6 grid grid-cols-2 gap-12">
            {menuColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">
                  {column.title}
                </h3>
                <ul className="space-y-4">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.href}
                        className="text-sm font-bold text-[#2A2623] hover:pl-2 hover:text-slate-500 transition-all duration-300 block border-l border-transparent hover:border-slate-200"
                        onMouseEnter={() => setHoveredItem(item)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* PROTECTED Preview Card */}
          <div className="col-span-4">
            <div className="bg-slate-50 p-6 rounded-xl min-h-[340px] flex flex-col justify-center border border-slate-100">
              {loading ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-[#2A2623]" /></div>
              ) : previewProduct ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#2A2623]">
                      {hoveredItem ? hoveredItem.label : 'Featured Pattern'}
                    </p>
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>

                  <Link to={`/product/${previewProduct.id}`} className="group block relative">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-4 bg-white shadow-inner select-none">
                      
                      {/* ✅ HIGH-VISIBILITY INDUSTRIAL WATERMARK */}
                      <div 
                        className="absolute inset-0 z-10 pointer-events-none opacity-[0.22]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='12' font-weight='900' fill='none' stroke='white' stroke-width='0.5' text-anchor='middle' transform='rotate(-35 40 40)'%3ERDC%3C/text%3E%3C/svg%3E")`,
                          backgroundRepeat: 'repeat'
                        }}
                      />

                      <img
                        src={getAssetUrl(previewProduct.assetUuid)}
                        alt={previewProduct.title}
                        draggable={false} // ✅ Prevent Image Drag
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {/* Security Darkening Overlay */}
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-all pointer-events-none" />
                    </div>

                    <h4 className="font-serif text-lg font-bold text-[#2A2623] group-hover:text-slate-600 transition-colors truncate">
                      {previewProduct.title}
                    </h4>
                    <p className="font-bold text-sm text-slate-500 mt-1">
                      ₹{(previewProduct.finalPriceCents / 100).toLocaleString('en-IN')}
                    </p>
                  </Link>
                </>
              ) : (
                <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">No matching assets found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;