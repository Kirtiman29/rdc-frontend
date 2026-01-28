import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Package, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import MegaMenu from './MegaMenu';
import SearchOverlay from './SearchOverlay';
import rdcLogo from '@/assets/rdc-logo.png';
import { getCart } from '@/api/cartApi'; // ✅ Connect to Port 8091
import { getToken } from '@/api/apiClient'; // ✅ Check JWT status

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Designs', href: '/gallery', hasMegaMenu: true },
  { label: 'Premium', href: '/premium' },
  { label: 'Trends', href: '/trends' },
  { label: 'Special Offers', href: '/special-offers' },
];

const Header = () => {
  const location = useLocation();
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ✅ Technical Logic: Cart & Auth State
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchHeaderData = async () => {
      if (getToken()) {
        try {
          const cart = await getCart();
          setCartCount(cart.totalItems);
        } catch (error) {
          console.error('Cart sync failed:', error);
        }
      }
    };
    fetchHeaderData();
  }, [location.pathname]); // Re-sync when user navigates

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border/50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex h-16 md:h-20 items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={rdcLogo} alt="RDC" className="h-8 md:h-10 w-auto" />
              <span className="font-serif text-xl md:text-2xl font-medium tracking-wide">RDC</span>
            </Link>

            {/* Center Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.hasMegaMenu && setShowMegaMenu(true)}
                  onMouseLeave={() => item.hasMegaMenu && setShowMegaMenu(false)}
                >
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
                  {item.hasMegaMenu && showMegaMenu && <MegaMenu />}
                </div>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Orders */}
              <Link
                to="/orders"
                className="hidden md:flex p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Orders"
              >
                <Package className="h-5 w-5" />
              </Link>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="hidden md:flex p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {/* ✅ FIXED: Dynamic Badge Count */}
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-foreground text-background text-[10px] font-medium rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile */}
              <Link
                to={getToken() ? "/profile" : "/login"} // ✅ Redirect to login if guest
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            'lg:hidden border-t border-border bg-background transition-all duration-300 overflow-hidden',
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-4 pt-4 border-t border-border">
              <Link
                to="/orders"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Package className="h-4 w-4" />
                Orders
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Heart className="h-4 w-4" />
                Wishlist
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Search Overlay */}
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Header;