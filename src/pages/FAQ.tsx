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
    question: 'What file formats are included with my purchase?',
    answer: 'You will receive your textile design in multiple high-resolution formats including JPG, TIFF, and PSD. These files are suitable for editing, textile printing, and professional production workflows.',
  },
  {
    question: 'Are the files editable?',
    answer: 'Yes, the designs are provided with editable files, allowing you to adjust colors, scale, and repeat settings based on your production requirements.',
  },
  {
    question: 'Will I receive seamless repeat patterns?',
    answer: 'Yes, all our designs are created as seamless repeat patterns, ensuring smooth and continuous printing on fabric without visible gaps or breaks.',
  },
  {
    question: 'Can I use the designs for commercial purposes?',
    answer: 'Yes, all designs can be used for commercial purposes including garments, fashion products, and fabric-based items. Please refer to our Terms & Conditions for detailed usage rights.',
  },
  {
    question: 'How do I download my purchased designs?',
    answer: 'After completing your purchase, you will receive an email with a download link within 24 hours. You can also access your files anytime from your account dashboard under "My Orders".',
  },
  {
    question: 'Do you offer exclusive textile designs?',
    answer: 'Yes, we offer exclusive designs for single-buyer use. Once purchased as exclusive, the design will not be sold to other customers.',
  },
  {
    question: 'Can I request customization or a custom textile design?',
    answer: 'Yes, we offer custom design services. You can contact us at crm@ruchitadesigncompany.com to discuss your requirements.',
  },
  {
    question: 'Are the designs suitable for digital fabric printing?',
    answer: 'Yes, all designs are created in high resolution and are fully suitable for digital fabric printing, ensuring clear and high-quality output.',
  },
  {
    question: 'Are the designs suitable for fashion and home textiles?',
    answer: 'Yes, our designs are suitable for a wide range of applications including fashion garments, apparel, and home décor textiles.',
  },
  {
    question: 'Do you offer bulk purchases or wholesale pricing?',
    answer: 'Yes, we offer bulk purchasing options and wholesale pricing. Please contact us at crm@ruchitadesigncompany.com for more details.',
  },
  {
    question: 'What is the quality of the designs for printing?',
    answer: 'All designs are created in high resolution (300 DPI or higher), ensuring excellent clarity and professional quality for textile printing.',
  },
  {
    question: 'How can I contact you for design inquiries?',
    answer: 'You can contact us anytime at crm@ruchitadesigncompany.com for design inquiries, support, or custom requests.',
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
