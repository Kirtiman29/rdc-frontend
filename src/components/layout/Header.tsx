//src/components/layout/Header.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, User, Heart, ShoppingBag, Package, 
  Menu, X, LogOut, ChevronRight, ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MegaMenu from './MegaMenu';
import SearchOverlay from './SearchOverlay';
import { getCart } from '@/api/cartApi';
import { getToken, clearTokens } from '@/api/apiClient';
import AIStudioLoader from "@/components/layout/AIStudioLoader";

// --- Types & Data ---

interface SubItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  hasMegaMenu?: boolean;
  hasDropdown?: boolean;
  submenu?: {
    main: Array<{ label: string; href: string }>;
    nested: Array<{ label: string; items: SubItem[] }>;
  };
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Designs', href: '/gallery', hasMegaMenu: true },
  { 
    label: 'Luxury', 
    href: '/luxury/explore', 
    hasDropdown: true,
    submenu: {
      main: [
        { label: 'Explore Luxury', href: '/luxury/explore' },
        { label: 'Shop All Luxury Designs', href: '/luxury/shop' },
      ],
      nested: []
    }
  },
  { label: 'Trends', href: '/trends/explore' },
  { label: 'Special Offers', href: '/special-offers/explore' },
  { 
    label: 'Fabrics', 
    href: '/fabrics/explore', 
    hasDropdown: true,
    submenu: {
      main: [
        { label: 'Explore Fabric', href: '/fabrics/explore' },
        { label: 'Shop All Fabric Designs', href: '/fabrics/shop' },
      ],
      nested: [
        { 
          label: 'By Color', 
          items: [
            { label: 'Blue', href: '/fabrics/color/blue' },
            { label: 'Red', href: '/fabrics/color/red' },
            { label: 'Neutral', href: '/fabrics/color/neutral' },
          ] 
        },
        { 
          label: 'By Project', 
          items: [
            { label: 'Upholstery', href: '/fabrics/project/upholstery' },
            { label: 'Apparel', href: '/fabrics/project/apparel' },
            { label: 'Quilting', href: '/fabrics/project/quilting' },
          ] 
        },
      ]
    }
  },
  { label: 'AI Studio', href: '/ai-studio' },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [showLoader, setShowLoader] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [cartCount, setCartCount] = useState(0);
  const [hasWishlistItems, setHasWishlistItems] = useState(false);
  const isLoggedIn = !!getToken();

  // Unified State for all Click-based Dropdowns
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Sync Cart Data
  useEffect(() => {
    const syncHeaderData = async () => {
      if (!isLoggedIn) {
        setCartCount(0);
        setHasWishlistItems(false);
        return;
      }
      try {
        const cart = await getCart();
        setCartCount(cart.totalItems || 0);
      } catch (error) {
        console.error('Header sync failed:', error);
      }
    };
    syncHeaderData();
    window.addEventListener("cart-updated", syncHeaderData);
    return () => window.removeEventListener("cart-updated", syncHeaderData);
  }, [isLoggedIn]);

  // Scroll Shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    clearTokens();
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
    setCartCount(0);
    setHasWishlistItems(false);
    navigate('/login');
  };

  const toggleDropdown = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdown(prev => prev === label ? null : label);
    setActiveSubmenu(null);
  };

  return (
    <>
      {showLoader && <AIStudioLoader onFinish={() => setShowLoader(false)} />}
      <header className={cn(
        "sticky top-0 z-50 w-full bg-background transition-all duration-300 border-b border-border/50",
        scrolled && "shadow-sm border-transparent"
      )}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex h-14 md:h-20 items-center justify-between">
            
            {/* Logo Group */}
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-foreground">
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/" className="flex items-center gap-2 shrink-0 select-none">
                <img src="/rdc-logo.png" alt="RDC" className="h-6 sm:h-8 md:h-10 w-auto" />
                <span className="hidden sm:block font-serif text-xl md:text-2xl font-medium tracking-wide">RDC</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8" ref={dropdownRef}>
              {navItems.map((item) => (
                <div key={item.label} className="relative">
                  {item.label === "AI Studio" ? (
                    <button
                      onClick={() => setShowLoader(true)}
                      className="text-sm font-medium tracking-wide transition-colors py-2 text-muted-foreground hover:text-foreground"
                    >
                      {item.label}
                    </button>
                  ) : (item.hasDropdown || item.hasMegaMenu) ? (
                    <button
                      onClick={(e) => toggleDropdown(e, item.label)}
                      className={cn(
                        'text-sm font-medium tracking-wide transition-colors py-2 flex items-center gap-1',
                        activeDropdown === item.label ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {item.label}
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform duration-200", 
                        activeDropdown === item.label ? "rotate-180" : "rotate-0"
                      )} />
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        'text-sm font-medium tracking-wide transition-colors py-2 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-foreground after:scale-x-0 after:origin-right after:transition-transform hover:after:scale-x-100 hover:after:origin-left',
                        location.pathname === item.href ? 'text-foreground after:scale-x-100' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  )}

                  {/* MEGAMENU (Click-triggered) */}
                  {item.hasMegaMenu && activeDropdown === item.label && (
                    <MegaMenu />
                  )}

                  {/* STANDARD DROPDOWN */}
                  {item.hasDropdown && activeDropdown === item.label && item.submenu && (
                    <div className="absolute top-full left-0 w-64 bg-white border border-border shadow-lg rounded-md py-2 mt-1 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                      {item.submenu.main.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}

                      {item.submenu.nested.length > 0 && (
                        <>
                          <div className="border-t border-border my-1" />
                          {item.submenu.nested.map((nestedGroup) => (
                            <div 
                              key={nestedGroup.label}
                              className="relative group/nested"
                              onMouseEnter={() => setActiveSubmenu(nestedGroup.label)}
                              onMouseLeave={() => setActiveSubmenu(null)}
                            >
                              <div className="flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-secondary/50 cursor-pointer">
                                {nestedGroup.label}
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                              
                              {activeSubmenu === nestedGroup.label && (
                                <div className="absolute left-full top-0 ml-[-1px] w-56 bg-white border border-border shadow-lg rounded-md py-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                  {nestedGroup.items.map((subItem) => (
                                    <Link
                                      key={subItem.label}
                                      to={subItem.href}
                                      onClick={() => setActiveDropdown(null)}
                                      className="block px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                                    >
                                      {subItem.label}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setShowSearch(true)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Search className="h-5 w-5" />
              </button>

              {isLoggedIn && (
                <Link to="/orders" className="hidden md:flex p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Package className="h-5 w-5" />
                </Link>
              )}

              <Link to="/wishlist" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Heart className="h-5 w-5" />
                {hasWishlistItems && <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />}
              </Link>

              <Link to="/cart" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-black text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {!isLoggedIn ? (
                <div className="hidden sm:flex items-center gap-4 ml-2">
                  <Link to="/login" className="text-xs font-bold uppercase tracking-widest hover:text-foreground">Login</Link>
                  <Link to="/signup" className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest rounded-sm">Register</Link>
                </div>
              ) : (
                <div className="relative ml-1" onMouseEnter={() => setShowProfileMenu(true)} onMouseLeave={() => setShowProfileMenu(false)}>
                  <button className="p-2 text-muted-foreground hover:text-foreground">
                    <User className="h-5 w-5" />
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 top-full w-48 bg-white border border-border shadow-xl py-2 z-50">
                      <Link to="/profile" className="block px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary/50">My Account</Link>
                      <Link to="/orders" className="block px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary/50">My Orders</Link>
                      <div className="border-t border-border my-1" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                        <LogOut className="h-3 w-3" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        <>
          <div className={cn("fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] lg:hidden transition-opacity", isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setIsMobileMenuOpen(false)} />
          <div className={cn('fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-background z-[70] transition-transform duration-300 lg:hidden shadow-2xl', isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full')}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <span className="font-serif text-lg tracking-wide">RDC</span>
                <button onClick={() => setIsMobileMenuOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <nav className="flex flex-col p-6 overflow-y-auto">
                {navItems.map((item) => (
                  <Link key={item.label} to={item.href} className="text-base font-light py-4 border-b border-border/20" onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link>
                ))}
                {isLoggedIn && (
                  <Link to="/profile" className="text-base font-light py-4 border-b border-border/20" onClick={() => setIsMobileMenuOpen(false)}>My Profile</Link>
                )}
                <div className="mt-auto pt-10 pb-6 flex flex-col gap-4">
                  {!isLoggedIn ? (
                    <Link to="/login" className="w-full py-3 border border-foreground/30 text-center text-sm tracking-widest">LOGIN</Link>
                  ) : (
                    <button onClick={handleLogout} className="w-full py-3 border border-rose-200 text-rose-600 text-sm tracking-widest flex items-center justify-center gap-2">LOGOUT</button>
                  )}
                </div>
              </nav>
            </div>
          </div>
        </>
      </header>
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Header;