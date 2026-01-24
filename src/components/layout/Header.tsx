import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Package, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import MegaMenu from './MegaMenu';
import rdcLogo from '@/assets/rdc-logo.png';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Designs', href: '/gallery', hasMegaMenu: true },
  { label: 'Premium', href: '/gallery?filter=premium' },
  { label: 'Trends', href: '/gallery?tag=trending' },
  { label: 'Special Offers', href: '/gallery?tag=special-offer' },
];

const Header = () => {
  const location = useLocation();
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
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
                    'text-sm font-medium tracking-wide transition-colors py-2',
                    location.pathname === item.href || 
                    (item.href !== '/' && location.pathname.startsWith(item.href.split('?')[0]))
                      ? 'text-foreground'
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
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search */}
            <div className="relative">
              {showSearch ? (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center animate-fade-in">
                  <input
                    type="text"
                    placeholder="Search designs..."
                    className="w-48 md:w-64 h-9 bg-secondary/50 border border-border rounded-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                    onBlur={() => setShowSearch(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

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
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-foreground text-background text-[10px] font-medium rounded-full flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Profile */}
            <Link
              to="/profile"
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
  );
};

export default Header;
