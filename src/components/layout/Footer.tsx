import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

// Pinterest icon component from your working code
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[#2A2623] text-white">
      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/rdc-logo.png" alt="RDC" className="h-8 w-auto" />
              <span className="font-serif text-xl font-medium tracking-wide">RDC</span>
            </Link>
            <p className="text-neutral-300 text-sm leading-relaxed">
              Luxury textile design patterns for fashion and lifestyle brands worldwide.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/Ruchitadesigncompany/" target="_blank" rel="noreferrer" aria-label="Facebook">
                <Facebook size={20} className="hover:text-[#ff1a1a] transition-colors" />
              </a>
              <a href="https://www.instagram.com/ruchitadesigncompany/" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram size={20} className="hover:text-[#ff1a1a] transition-colors" />
              </a>
              <a href="https://in.pinterest.com/RuchitaDesignCompanys/" target="_blank" rel="noreferrer" aria-label="Pinterest">
                <PinterestIcon className="h-5 w-5 hover:text-[#ff1a1a] transition-colors" />
              </a>
              <a href="https://in.linkedin.com/company/ruchita-design-pvt-ltd" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <Linkedin size={20} className="hover:text-[#ff1a1a] transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors">Gallery</Link></li>
              <li><Link to="/luxury/explore" className="hover:text-white transition-colors">Luxury</Link></li>
              <li><Link to="/trends/explore" className="hover:text-white transition-colors">Trends</Link></li>
              <li><Link to="/blogs" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Contact</h4>
            <div className="space-y-2 text-sm text-neutral-300">
              <div className="flex items-center space-x-2">
                <Mail size={16} />
                <span>crm@ruchitadesigncompany.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} />
                <span>+91 99200 56143</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>Bhandup, Mumbai, India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-12 pt-8 text-center text-sm text-neutral-400">
          <p>&copy; {new Date().getFullYear()} RDC Textiles. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}