import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Privacy = () => {
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
              Privacy Policy
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
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                RDC Textiles ("we," "our," or "us") respects your privacy and is committed 
                to protecting your personal data. This Privacy Policy explains how we collect, 
                use, and safeguard your information when you visit our website or make a purchase.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                Information We Collect
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Name and contact information (email address)</li>
                <li>Account credentials</li>
                <li>Payment information (processed securely by our payment provider)</li>
                <li>Purchase history and preferences</li>
                <li>Communications you send to us</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Process and fulfill your orders</li>
                <li>Send you order confirmations and updates</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Detect and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                Information Sharing
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. 
                We may share your information with service providers who assist us in operating 
                our website, conducting our business, or serving you, provided they agree to 
                keep this information confidential.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                Cookies and Tracking
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to enhance your browsing experience, 
                analyze site traffic, and personalize content. You can control cookie settings 
                through your browser preferences.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                Data Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. However, 
                no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                Your Rights
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                Data Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the 
                purposes outlined in this Privacy Policy, unless a longer retention period is 
                required or permitted by law.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                Changes to This Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of 
                any changes by posting the new Privacy Policy on this page and updating the 
                "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl md:text-2xl font-medium mb-4">
                Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, 
                please contact us at{' '}
                <a href="mailto:privacy@rdctextiles.com" className="text-foreground hover:underline">
                  privacy@ruchitadesigncompany.com
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

export default Privacy;
