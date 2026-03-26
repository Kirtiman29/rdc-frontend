// src/components/layout/Header.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Package, Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import MegaMenu from './MegaMenu';
import SearchOverlay from './SearchOverlay';
import { getCart } from '@/api/cartApi';
import { getToken, clearTokens } from '@/api/apiClient';
import AIStudioLoader from "@/components/layout/AIStudioLoader";
import NavDropdown from "./NavDropdown";

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Designs', href: '/gallery', hasMegaMenu: true },
  { label: 'Luxury', href: '/luxury' , hasDropdown: true },
  { label: 'Trends', href: '/trends' },
  { label: 'Special Offers', href: '/special-offers' },
  { label: 'Fabrics', href: '/fabrics/explore' , hasDropdown: true},
  { label: 'AI Studio', href: '/ai-studio' },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLoader, setShowLoader] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [cartCount, setCartCount] = useState(0);
  const [hasWishlistItems, setHasWishlistItems] = useState(false);
  const isLoggedIn = !!getToken();
const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  // 1️⃣ Header Sync Logic (Cart & Wishlist)
  useEffect(() => {
    const syncHeaderData = async () => {
      if (!isLoggedIn) {
        setCartCount(0);
        setHasWishlistItems(false);
        return;
      }

      try {
        // Parallel fetching for better performance
        const cart = await getCart();
        setCartCount(cart.totalItems || 0);

        // Optional: Add Wishlist check logic here if API exists
        // const wishlist = await getWishlist();
        // setHasWishlistItems(wishlist.items?.length > 0);
      } catch (error) {
        console.error('Header sync failed:', error);
      }
    };

    syncHeaderData();

    // Event Listener for real-time updates from other components
    const handleCartUpdate = () => syncHeaderData();
    window.addEventListener("cart-updated", handleCartUpdate);

    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [isLoggedIn]);

  // Handle Scroll Shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
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

  return (
    <>
      {showLoader && <AIStudioLoader onFinish={() => setShowLoader(false)} />}
      <header className={cn(
        "sticky top-0 z-50 w-full bg-background transition-all duration-300 border-b border-border/50",
        scrolled && "shadow-sm border-transparent"
      )}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex h-14 md:h-20 items-center justify-between">
            
            {/* Mobile Left: Hamburger + Logo Group */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 text-foreground"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link to="/" className="flex items-center gap-2 shrink-0 select-none">
                <img src="/rdc-logo.png" alt="RDC" className="h-6 sm:h-8 md:h-10 w-auto" />
                <span className="hidden sm:block font-serif text-xl md:text-2xl font-medium tracking-wide">
                  RDC
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                    onMouseEnter={() => {
                    if (item.hasMegaMenu) setShowMegaMenu(true);
                    if (item.hasDropdown) setActiveDropdown(item.label);
                      }}
                    onMouseLeave={() => {
                    if (item.hasMegaMenu) setShowMegaMenu(false);
                    if (item.hasDropdown) setActiveDropdown(null);
}}
                >
                  
                  {item.label === "AI Studio" ? (
                    <button
                      onClick={() => {
                        setShowLoader(true);
                      }}
                      className={cn(
                      'text-sm font-medium tracking-wide transition-colors py-2 relative',
                      'after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-foreground after:scale-x-0 after:origin-right after:transition-transform hover:after:scale-x-100 hover:after:origin-left',
                      'text-muted-foreground hover:text-foreground'
                    )}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        'text-sm font-medium tracking-wide transition-colors py-2 relative',
                        'after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-foreground after:scale-x-0 after:origin-right after:transition-transform hover:after:scale-x-100 hover:after:origin-left',
                        location.pathname === item.href || 
                        (item.href !== '/' && location.pathname.startsWith(item.href.split('?')[0]))
                          ? 'text-foreground after:scale-x-100'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                  {item.hasDropdown && activeDropdown === item.label && (
                  <NavDropdown type={item.label.toLowerCase() as "fabrics" | "luxury"} />
        )}
                  {item.hasMegaMenu && showMegaMenu && <MegaMenu />}
                </div>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {isLoggedIn && (
                <Link 
                  to="/orders" 
                  className="hidden md:flex p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="My Orders"
                >
                  <Package className="h-5 w-5" />
                </Link>
              )}

              {/* Wishlist with Premium Indicator */}
              <Link 
                to="/wishlist" 
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" 
                title="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {hasWishlistItems && (
                  <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-red-500 rounded-full animate-in fade-in zoom-in duration-300"></span>
                )}
              </Link>

              {/* Cart with Professional Bubble */}
              <Link to="/cart" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" title="Cart">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-black text-white text-[10px] font-semibold rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile/Auth Toggle */}
              {!isLoggedIn ? (
                <div className="hidden sm:flex items-center gap-4 ml-2">
                  <Link to="/login" className="text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors">
                    Login
                  </Link>
                  <Link to="/signup" className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-all">
                    Register
                  </Link>
                </div>
              ) : (
                <div 
                  className="relative ml-1" 
                  onMouseEnter={() => setShowProfileMenu(true)} 
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <User className="h-5 w-5" />
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 top-full w-48 bg-white border border-border shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200">
                      <Link to="/profile" className="block px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
                        My Account
                      </Link>
                      <Link to="/orders" className="block px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
                        My Orders
                      </Link>
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

        {/* MOBILE DRAWER SYSTEM */}
        <>
          <div 
            className={cn(
              "fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity lg:hidden",
              isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div className={cn(
            'fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-background z-[70] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:hidden shadow-2xl', 
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <img src="/rdc-logo.png" className="h-6 w-auto" alt="Logo" />
                  <span className="font-serif text-lg tracking-wide">RDC</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <nav className="flex flex-col p-6 overflow-y-auto">
                {navItems.map((item) => (
                  <Link 
                    key={item.label} 
                    to={item.href} 
                    className={cn(
                      "text-base font-light tracking-wide transition-all py-4 border-b border-border/20",
                      location.pathname === item.href 
                        ? "text-foreground font-medium" 
                        : "text-foreground/70"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                
                {isLoggedIn && (
                  <>
                    <Link to="/orders" className="text-base font-light tracking-wide text-foreground/70 py-4 border-b border-border/20" onClick={() => setIsMobileMenuOpen(false)}>
                      My Orders
                    </Link>
                    <Link to="/profile" className="text-base font-light tracking-wide text-foreground/70 py-4 border-b border-border/20" onClick={() => setIsMobileMenuOpen(false)}>
                      My Profile
                    </Link>
                  </>
                )}
                
                <div className="mt-auto pt-10 pb-6 flex flex-col gap-4">
                  {!isLoggedIn ? (
                    <>
                      <Link 
                        to="/login" 
                        className="w-full py-3 border border-foreground/30 text-center text-sm tracking-widest hover:bg-foreground hover:text-white transition-all duration-300" 
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        LOGIN
                      </Link>
                      <Link 
                        to="/signup" 
                        className="w-full py-3 bg-foreground text-background text-center text-sm tracking-widest hover:opacity-90 transition-all duration-300" 
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        CREATE ACCOUNT
                      </Link>
                    </>
                  ) : (
                    <button 
                      onClick={handleLogout}
                      className="w-full py-3 border border-rose-200 text-rose-600 text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 transition-all"
                    >
                      <LogOut className="h-4 w-4" /> LOGOUT
                    </button>
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