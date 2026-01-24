import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="font-serif text-2xl font-medium tracking-wide mb-4">RDC</h2>
            <p className="text-sm text-background/70 leading-relaxed max-w-xs">
              Premium textile design patterns for fashion and lifestyle brands worldwide.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] mb-4 text-background/50">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-background/70 hover:text-background transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-background/70 hover:text-background transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-background/70 hover:text-background transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] mb-4 text-background/50">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-sm text-background/70 hover:text-background transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/licensing" className="text-sm text-background/70 hover:text-background transition-colors">
                  Licensing
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-sm text-background/70 hover:text-background transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] mb-4 text-background/50">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-sm text-background/70 hover:text-background transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-background/70 hover:text-background transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-background/70 hover:text-background transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-background/10">
          <p className="text-xs text-background/50 text-center">
            © {new Date().getFullYear()} RDC Textiles. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
