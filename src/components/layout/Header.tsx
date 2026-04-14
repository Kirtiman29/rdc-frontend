import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, User, Heart, ShoppingBag,
  Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MegaMenu from './MegaMenu';
import SearchOverlay from './SearchOverlay';
import { getCart } from '@/api/cartApi';
import AIStudioLoader from "@/components/layout/AIStudioLoader";
import { useAuth } from '@/hooks/useAuth';

let hoverTimeout: any;

const navItems = [
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
  { label: 'Blogs', href: '/blogs' },
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
      ]
    }
  },
  { label: 'AI Studio', href: '/ai-studio', isSpecial: true },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, logout } = useAuth();

  const [showLoader, setShowLoader] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [cartCount, setCartCount] = useState(0);

  const profileLabel = user?.name?.trim()?.charAt(0)?.toUpperCase() || user?.email?.trim()?.charAt(0)?.toUpperCase() || "U";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {showLoader && <AIStudioLoader onFinish={() => setShowLoader(false)} />}

      {/* Announcement Bar (Optional - Premium Feel) */}
      <div className={cn(
        "bg-[#2A2623] text-white text-[10px] tracking-[0.2em] uppercase py-2 text-center transition-all duration-500 overflow-hidden",
        scrolled ? "h-0 opacity-0" : "h-8 opacity-100"
      )}>
       Get Special Offers Upto 20% for New User's
      </div>

      <header className={cn(
        "sticky top-0 z-50 w-full bg-white/80 transition-all duration-500 ease-in-out border-b border-transparent",
        scrolled ? "py-2 backdrop-blur-xl border-black/5 shadow-[0_4px_30px_rgba(0,0,0,0.03)]" : "py-6 backdrop-blur-none"
      )}>
        <div className="w-full px-16 px-6 lg:px-12">
          <div className="flex items-center justify-between gap-8">

            {/* LEFT: Logo Section */}
            <div className="flex items-center gap-4 lg:flex-1">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 text-[#2A2623] transition-transform active:scale-90"
              >
                <Menu className="h-5 w-5 stroke-[1.5px]" />
              </button>
              <Link to="/" className="flex items-center gap-3 group select-none">
                <img
                  src="/rdc-logo.png"
                  alt="RDC"
                  className={cn(
                    "transition-all duration-500 ease-in-out",
                    scrolled ? "h-7" : "h-9"
                  )}
                />
                <span className={cn(
                  "font-serif tracking-[0.1em] font-medium text-[#2A2623] transition-all duration-500",
                  scrolled ? "text-lg" : "text-2xl"
                )}>RDC</span>
              </Link>
            </div>

            {/* CENTER: Navigation Section */}
            <nav className="hidden lg:flex items-center gap-10" ref={dropdownRef}>
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className={cn("py-2", !item.hasMegaMenu && "relative")}
                  onMouseEnter={() => {
                    clearTimeout(hoverTimeout);
                    if (item.hasDropdown || item.hasMegaMenu) {
                      setActiveDropdown(item.label);
                    }
                  }}
                  onMouseLeave={() => {
                    hoverTimeout = setTimeout(() => setActiveDropdown(null), 150);
                  }}
                >
                  {item.isSpecial ? (
                    <button
                      onClick={() => setShowLoader(true)}
                      className="group relative px-4 py-1.5 overflow-hidden rounded-full transition-all duration-500"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600 opacity-90 transition-transform duration-500 group-hover:scale-105" />
                      <span className="relative text-[11px] font-bold uppercase tracking-widest text-white flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        {item.label}
                      </span>
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-300 relative py-1",
                        location.pathname === item.href ? "text-[#2A2623]" : "text-[#2A2623]/50 hover:text-[#2A2623]"
                      )}
                    >
                      {item.label}
                      {/* Underline Animation */}
                      <span className={cn(
                        "absolute bottom-0 left-0 h-[1.5px] bg-[#2A2623] transition-all duration-500 ease-out",
                        location.pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                      )} />
                    </Link>
                  )}

                  {/* MegaMenu for Designs */}
                  {item.hasMegaMenu && activeDropdown === item.label && (
                    <div className="absolute left-0 top-full w-full animate-in fade-in slide-in-from-top-2 duration-300 z-50">
                      <div className="bg-white/95 backdrop-blur-md border border-[#2A2623]/5 shadow-2xl rounded-sm">
                        <MegaMenu />
                      </div>
                    </div>
                  )}

                  {/* Standard Dropdown */}
                  {item.hasDropdown && activeDropdown === item.label && item.submenu && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-56 pt-4 animate-in fade-in slide-in-from-top-2 duration-300 z-50">
                      <div className="bg-white/95 backdrop-blur-md border border-[#2A2623]/5 shadow-2xl rounded-sm p-4">
                        {item.submenu.main.map((sub) => (
                          <Link
                            key={sub.label}
                            to={sub.href}
                            className="block py-2 text-[10px] uppercase tracking-widest text-[#2A2623]/60 hover:text-[#2A2623] transition-all hover:translate-x-1"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* RIGHT: Icons Section */}
            <div className="flex items-center justify-end gap-2 sm:gap-5 lg:flex-1">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-[#2A2623]/70 hover:text-[#2A2623] transition-all hover:scale-110 active:scale-95"
              >
                <Search className="h-[18px] w-[18px] stroke-[1.5px]" />
              </button>

              <Link to="/wishlist" className="hidden sm:block p-2 text-[#2A2623]/70 hover:text-[#2A2623] transition-all hover:scale-110">
                <Heart className="h-[18px] w-[18px] stroke-[1.5px]" />
              </Link>

              <Link to="/cart" className="relative p-2 text-[#2A2623]/70 hover:text-[#2A2623] transition-all hover:scale-110">
                <ShoppingBag className="h-[18px] w-[18px] stroke-[1.5px]" />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center bg-[#2A2623] text-[8px] font-bold text-white rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative group ml-2">
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2A2623]/15 bg-[#2A2623] text-xs font-bold uppercase tracking-widest text-white transition-all hover:scale-105">
                    {profileLabel}
                  </button>

                  <div className="absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                    <div className="bg-white border border-[#2A2623]/5 shadow-2xl min-w-52 p-4 flex flex-col gap-3">
                      <div className="border-b border-[#2A2623]/5 pb-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Signed in as</p>
                        <p className="mt-1 text-sm font-medium text-[#2A2623]">{user?.email || user?.name || "User"}</p>
                      </div>
                      <Link to="/profile" className="text-[10px] uppercase tracking-widest font-bold hover:text-red-500">Account</Link>
                      <Link to="/orders" className="text-[10px] uppercase tracking-widest font-bold hover:text-red-500">Orders</Link>
                      <div className="h-[1px] bg-[#2A2623]/5" />
                      <button onClick={handleLogout} className="text-[10px] uppercase tracking-widest font-bold text-red-500 text-left">Logout</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ml-2 hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A2623] transition-colors hover:text-black"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-sm bg-[#2A2623] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black"
                  >
                    Signup
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE NAV: Minimalist Sidebar */}
      <div className={cn(
        "fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity duration-500 lg:hidden",
        isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsMobileMenuOpen(false)} />

      <div className={cn(
        "fixed top-0 left-0 bottom-0 w-[80%] max-w-[360px] bg-white z-[101] shadow-2xl transition-transform duration-500 ease-expo lg:hidden flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 border-b border-[#2A2623]/5 flex justify-between items-center">
          <span className="font-serif text-2xl tracking-widest text-[#2A2623]">RDC</span>
          <button onClick={() => setIsMobileMenuOpen(false)}><X className="h-6 w-6 stroke-[1.5px]" /></button>
        </div>

        <nav className="flex flex-col p-8 gap-6">
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xl font-light tracking-tight text-[#2A2623] border-b border-[#2A2623]/5 pb-4 last:border-0"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {item.label}
            </Link>
          ))}

          <div className="border-t border-[#2A2623]/5 pt-6">
            {isAuthenticated ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Signed in as</p>
                  <p className="mt-1 text-sm font-medium text-[#2A2623]">{user?.email || user?.name || "User"}</p>
                </div>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[#2A2623]">
                  Profile
                </Link>
                <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[#2A2623]">
                  Orders
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-left text-sm font-medium text-red-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center rounded-sm border border-[#2A2623]/15 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2A2623]"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center rounded-sm bg-[#2A2623] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
                >
                  Signup
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Header;
