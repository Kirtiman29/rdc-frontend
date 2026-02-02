import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Package, Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import MegaMenu from './MegaMenu';
import SearchOverlay from './SearchOverlay';
import rdcLogo from '@/assets/rdc-logo.png';
import { getCart } from '@/api/cartApi';
import { getToken, removeToken } from '@/api/apiClient';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Designs', href: '/gallery', hasMegaMenu: true },
  { label: 'Premium', href: '/premium' },
  { label: 'Trends', href: '/trends' },
  { label: 'Special Offers', href: '/special-offers' },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [cartCount, setCartCount] = useState(0);
  const isLoggedIn = !!getToken();

  useEffect(() => {
    const fetchHeaderData = async () => {
      if (isLoggedIn) {
        try {
          const cart = await getCart();
          setCartCount(cart.totalItems);
        } catch (error) {
          console.error('Cart sync failed:', error);
        }
      }
    };
    fetchHeaderData();
  }, [location.pathname, isLoggedIn]);

  const handleLogout = () => {
    removeToken();
    setShowProfileMenu(false);
    navigate('/login');
  };

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
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* ✅ ADDED: My Orders Icon */}
              {isLoggedIn && (
                <Link 
                  to="/orders" 
                  className="hidden md:flex p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="My Orders"
                >
                  <Package className="h-5 w-5" />
                </Link>
              )}

              <Link to="/wishlist" className="hidden md:flex p-2 text-muted-foreground hover:text-foreground transition-colors" title="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>

              <Link to="/cart" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" title="Cart">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-foreground text-background text-[10px] font-medium rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Auth Toggle */}
              {!isLoggedIn ? (
                <div className="flex items-center gap-4 ml-2">
                  <Link to="/login" className="text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors">
                    Login
                  </Link>
                  <Link to="/signup" className="px-4 py-2 bg-[#2A2623] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-black transition-all">
                    Register
                  </Link>
                </div>
              ) : (
                <div 
                  className="relative ml-2" 
                  onMouseEnter={() => setShowProfileMenu(true)} 
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <User className="h-5 w-5" />
                  </button>
                  
                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 top-full w-48 bg-white border border-border shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200">
                      <Link to="/profile" className="block px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
                        My Account
                      </Link>
                      <Link to="/orders" className="block px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
                        My Orders
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="h-3 w-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={cn('lg:hidden border-t border-border bg-background transition-all duration-300 overflow-hidden', isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link key={item.label} to={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link to="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>
                My Orders
              </Link>
            )}
            {!isLoggedIn && (
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <Link to="/login" className="text-sm font-bold uppercase tracking-widest" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                <Link to="/signup" className="text-sm font-bold uppercase tracking-widest text-[#c9a96e]" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Header;