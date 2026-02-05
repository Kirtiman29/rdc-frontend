// src/pages/About.tsx

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Our Story
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-3">
              About RDC Studio
            </h1>
          </div>

          {/* Content */}
          <div className="space-y-12 md:space-y-16">
            
            {/* Our Vision */}
            <section className="text-center">
              <h2 className="text-sm font-medium uppercase tracking-widest text-primary mb-4">
                Textile Innovation. Global Production. Digital Speed.
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Ruchita Design Company (RDC) is a premier digital destination for textile innovation, bridging the gap between world-class creative vision and global industrial production. At the forefront of an ever-evolving industry, we are redefining how textile designs are sourced, licensed, and integrated into the modern supply chain.
              </p>
            </section>

            {/* Our Identity */}
            <section>
              <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
                The Synthesis of Art and Industry
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                At Ruchita Design Company, we have synthesized years of design mastery with deep-rooted expertise in textile manufacturing, global trend-forecasting, and digital technology. Our mission has been to evolve into the industry's go-to virtual textile studio platform—providing a seamless, high-end design experience for the world's most discerning brands.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By merging artistic soul with technical precision, we deliver a streamlined digital solution that empowers our clients to stay ahead of the curve.
              </p>
            </section>

            {/* Our Foundation */}
            <section>
              <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
                History & Leadership
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Founded in 2020 by a visionary team of industry insiders, Ruchita Design Company was established with a singular mission: to empower global brands by making the sourcing of world-class textile design more seamless and accessible than ever before.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Led by Directors Ruchita Gudhka and Vatsal Gudhka, we connect the industry's most sophisticated creative talent with market leaders across the worlds of Fashion, Homeware, Interiors, and Lifestyle. As a specialized B2B service and design platform, we offer a high-speed, streamlined experience where clients can discover curated artwork and instantly acquire production-ready digital files.
              </p>
            </section>

           {/* The Collection */}
<section>
  <h2 className="font-serif text-2xl md:text-3xl font-medium mb-8">
    Curated for Excellence. Engineered for Production.
  </h2>

  <ul className="space-y-8">
    <li className="flex gap-4">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>
      <div>
        <h3 className="text-foreground font-medium mb-2">
          Seamless Navigation
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Our intuitive platform is designed for the modern buyer. A simple-to-use
          search and filtering system enables you to effortlessly navigate through
          our collection—from latest trend arrivals to extensive archives.
        </p>
      </div>
    </li>

    <li className="flex gap-4">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>
      <div>
        <h3 className="text-foreground font-medium mb-2">
          Flexible Licensing
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          We offer several license formats tailored to your specific needs,
          whether for exclusive commercial use or specialized industrial projects.
        </p>
      </div>
    </li>

    <li className="flex gap-4">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>
      <div>
        <h3 className="text-foreground font-medium mb-2">
          Instant Delivery
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          From secure payment to the direct download of high-resolution digital
          files, the entire transaction is completed within the secure RDC
          platform—ensuring you move from inspiration to production without delay.
        </p>
      </div>
    </li>
  </ul>
</section>


            {/* Inspiration & Trends */}
            <section>
              <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
                The Pulse of Global Culture
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our specialized trends team acts as the heartbeat of the RDC Studio. From international catwalks and emerging street style to contemporary art exhibitions and global trade shows—we analyze the shifts so you don't have to. 
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We translate complex cultural movements into actionable design insights, ensuring that when you partner with us, your brand isn't just following the curve—it's staying ahead of it.
              </p>
            </section>

            {/* Mission Statement / Quote */}
            <section className="text-center pt-8 border-t border-border">
              <blockquote className="font-serif text-xl md:text-2xl italic text-foreground/80 max-w-2xl mx-auto">
                "We provide brands with 24/7 access to high-caliber, production-ready patterns engineered for technical precision and designed to lead global trends."
              </blockquote>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;