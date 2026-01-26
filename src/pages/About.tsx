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
              About Us
            </h1>
          </div>

          {/* Content */}
          <div className="space-y-12 md:space-y-16">
            {/* Introduction */}
            <section className="text-center">
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                RDC Textiles is a premier destination for digital textile design patterns, 
                serving fashion houses, interior designers, and creative brands worldwide. 
                Our curated collection represents the pinnacle of contemporary textile artistry.
              </p>
            </section>

            {/* Craftsmanship */}
            <section>
              <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
                Craftsmanship
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Every design in our collection is meticulously crafted by skilled artisans 
                and digital artists who understand the delicate balance between tradition 
                and innovation. Our patterns are created with precision, ensuring seamless 
                repeats and print-ready quality.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We work with high-resolution TIFF files that preserve every detail, 
                allowing our clients to produce stunning textiles that stand out in 
                the competitive fashion and interior design markets.
              </p>
            </section>

            {/* Textile Creativity */}
            <section>
              <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
                Textile Creativity
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our design philosophy embraces both timeless elegance and contemporary 
                trends. From intricate floral motifs inspired by classical gardens to 
                bold geometric patterns that define modern aesthetics, our collection 
                spans the full spectrum of textile artistry.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Each season, we introduce new collections that reflect global design 
                movements while maintaining the premium quality our clients expect.
              </p>
            </section>

            {/* Digital Design Excellence */}
            <section>
              <h2 className="font-serif text-2xl md:text-3xl font-medium mb-6">
                Digital Design Excellence
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In an era where digital precision meets artistic vision, we leverage 
                cutting-edge technology to create designs that translate beautifully 
                from screen to fabric. Our digital-first approach ensures consistency, 
                scalability, and ease of production.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every pattern undergoes rigorous quality checks to ensure color 
                accuracy, seamless tiling, and compatibility with various printing 
                and weaving technologies.
              </p>
            </section>

            {/* Mission Statement */}
            <section className="text-center pt-8 border-t border-border">
              <blockquote className="font-serif text-xl md:text-2xl italic text-foreground/80 max-w-2xl mx-auto">
                "To inspire creativity and elevate textile design through 
                exceptional digital patterns that blend artistry with functionality."
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
