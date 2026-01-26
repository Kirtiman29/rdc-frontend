import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          {/* Page Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Legal
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-3">
              Terms & Conditions
            </h1>
          </div>

          {/* Last Updated */}
          <p className="text-sm text-muted-foreground mb-12 text-center">
            Last updated: January 2024
          </p>

          {/* Content */}
          <div className="prose prose-neutral max-w-none">
            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using RDC Textiles website and services, you accept and agree 
                to be bound by these Terms and Conditions. If you do not agree to these terms, 
                please do not use our services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                2. Digital Products
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All products sold on RDC Textiles are digital design files. Upon purchase, 
                you will receive access to download the design files in the specified format.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Digital products are non-refundable once downloaded. Please review product 
                descriptions and preview images carefully before making a purchase.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                3. License Grant
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Upon purchase, you are granted a non-exclusive, non-transferable license to 
                use the design for commercial manufacturing purposes. This includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Printing on fabrics and textiles for sale</li>
                <li>Creating products incorporating the design</li>
                <li>Using in your brand's product line</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                4. Restrictions
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The following uses are strictly prohibited:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Reselling, sharing, or redistributing the original design files</li>
                <li>Using designs in print-on-demand services where the design itself is the primary product</li>
                <li>Claiming ownership or authorship of the original design</li>
                <li>Using designs in any unlawful or defamatory manner</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                5. Intellectual Property
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All designs remain the intellectual property of RDC Textiles and its designers. 
                The purchase of a design grants a license for use, not ownership of the 
                intellectual property rights.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                6. Payment Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All prices are displayed in USD. Payment is required at the time of purchase. 
                We accept major credit cards and other payment methods as displayed at checkout.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                7. Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                RDC Textiles shall not be liable for any indirect, incidental, special, or 
                consequential damages arising from the use of our products or services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                8. Changes to Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Changes will be 
                effective immediately upon posting to the website. Continued use of our 
                services constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                9. Contact
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions regarding these Terms & Conditions, please contact us at{' '}
                <a href="mailto:legal@rdctextiles.com" className="text-foreground hover:underline">
                  legal@rdctextiles.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
