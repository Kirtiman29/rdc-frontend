import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
}

const Header = ({ cartItemCount = 0, onCartClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Collections', href: '/gallery' },
    { name: 'Digital Patterns', href: '/gallery?category=digital' },
    { name: 'Fabrics', href: '/gallery?category=fabric' },
    { name: 'Custom', href: '/gallery?category=custom' },
    { name: 'About', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:h-20">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <h1 className="font-serif text-xl font-medium tracking-wide md:text-2xl">
            ATELIER
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-sm font-light tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Account">
            <User className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onCartClick}
            aria-label="Shopping cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'absolute left-0 right-0 top-full border-b border-border bg-background transition-all duration-300 md:hidden',
          isMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <nav className="container flex flex-col gap-4 px-4 py-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-base font-light tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
