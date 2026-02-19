import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitContactInquiry } from '@/api/contactApi'; // ✅ Connect to real API

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Security: Restrict Right-Click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      /**
       * ✅ PRODUCTION SYNC:
       * Transmission of inquiry to the Admin Backend (Port 8080).
       * The centralized apiClient handles the production base URL via env.
       */
      await submitContactInquiry(formData);

      toast({
        title: "Message sent",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });

      // Clear form on success
      setFormData({ name: '', email: '', message: '' });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "We could not process your message at this time. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" onContextMenu={handleContextMenu}>
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-2xl">
          {/* Page Header Restored */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Get In Touch
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-3">
              Contact
            </h1>
          </div>

          {/* Introduction Restored */}
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Have a question about our designs or need assistance with your order? 
            We'd love to hear from you.
          </p>

          {/* Contact Form Restored */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-background border-border focus:border-foreground/30 h-11"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-background border-border focus:border-foreground/30 h-11"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Message
              </label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
                className="bg-background border-border focus:border-foreground/30 resize-none"
                placeholder="How can we help you?"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#2A2623] hover:bg-black text-white font-medium transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>

          {/* Alternative Contact Restored */}
          <div className="mt-16 pt-12 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Prefer email?
            </p>
            <a 
              href="mailto:hr@ruchitadesigncompany.com" 
              className="text-[#2A2623] font-medium hover:underline"
            >
              crm@ruchitadesigncompany.com
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;