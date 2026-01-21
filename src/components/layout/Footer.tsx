import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block">
              <h2 className="font-serif text-2xl font-medium tracking-wide">ATELIER</h2>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Curating exceptional textile designs for discerning creators and collectors.
            </p>
          </div>

          {/* Collections */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-medium uppercase tracking-widest">
              Collections
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/gallery?category=digital"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Digital Patterns
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery?category=fabric"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Premium Fabrics
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery?category=custom"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Custom Services
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery?category=ready-made"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ready-Made
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-medium uppercase tracking-widest">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/care"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Care Instructions
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-medium uppercase tracking-widest">
              Stay Connected
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Join our newsletter for exclusive previews and design inspiration.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                className="rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Atelier Textiles. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
