import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      question: 'What file format are the designs delivered in?',
      answer: 'All our designs are delivered as high-resolution TIFF files, ensuring maximum quality for professional printing and production. Files are typically 300 DPI or higher and include seamless repeat information where applicable.',
    },
    {
      question: 'Can I use the designs for commercial purposes?',
      answer: 'Yes, all purchases include a commercial license that allows you to use the designs for manufacturing and selling products. Please review our Terms & Conditions for specific usage rights and limitations.',
    },
    {
      question: 'How do I download my purchased designs?',
      answer: 'After completing your purchase, you will receive an email with a download link. You can also access your purchased designs anytime from your account dashboard under "My Orders".',
    },
    {
      question: 'Do you offer custom design services?',
      answer: 'Yes, we offer custom design services for brands looking for exclusive patterns. Please contact us through our Contact page to discuss your requirements and receive a quote.',
    },
    {
      question: 'What is your refund policy?',
      answer: 'Due to the digital nature of our products, we do not offer refunds once a design has been downloaded. However, if you experience any technical issues, please contact our support team and we will assist you.',
    },
    {
      question: 'How often do you release new designs?',
      answer: 'We release new collections seasonally, with additional individual designs added throughout the year. Subscribe to our newsletter to stay updated on new releases.',
    },
    {
      question: 'Do you offer bulk discounts?',
      answer: 'Yes, we offer volume discounts for bulk purchases. Please contact our sales team for pricing on orders of 100 or more designs.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          {/* Page Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Help Center
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-3">
              FAQs
            </h1>
          </div>

          {/* Introduction */}
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Find answers to commonly asked questions about our products, 
            licensing, and services.
          </p>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border px-6 data-[state=open]:border-foreground/30 transition-colors"
              >
                <AccordionTrigger className="text-left font-serif text-lg hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Still Have Questions */}
          <div className="mt-16 pt-12 border-t border-border text-center">
            <p className="text-muted-foreground mb-4">
              Still have questions?
            </p>
            <a 
              href="/contact" 
              className="text-foreground hover:underline font-medium"
            >
              Contact our support team →
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
