import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ArrowRight } from 'lucide-react';

const Careers = () => {
  const openPositions = [
    {
      title: 'Senior Textile Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'Digital Pattern Artist',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
    },
    {
      title: 'E-commerce Manager',
      department: 'Operations',
      location: 'Remote',
      type: 'Full-time',
    },
  ];

  const benefits = [
    'Remote-first culture',
    'Flexible working hours',
    'Creative freedom',
    'Professional development',
    'Collaborative environment',
    'Industry-leading compensation',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Join Our Team
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-3">
              Careers
            </h1>
          </div>

          {/* Introduction */}
          <section className="text-center mb-16">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Join a team of passionate designers and innovators shaping the future 
              of digital textile design. We're always looking for talented individuals 
              who share our vision for excellence.
            </p>
          </section>

          {/* Why Work With Us */}
          <section className="mb-16 md:mb-20">
            <h2 className="font-serif text-2xl md:text-3xl font-medium mb-8 text-center">
              Why Work With Us
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="p-6 border border-border text-center hover:border-foreground/30 transition-colors"
                >
                  <p className="text-sm md:text-base text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Open Positions */}
          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-medium mb-8 text-center">
              Open Positions
            </h2>
            <div className="space-y-4">
              {openPositions.map((position, index) => (
                <div 
                  key={index}
                  className="group p-6 border border-border hover:border-foreground/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-lg md:text-xl font-medium mb-2">
                        {position.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>{position.department}</span>
                        <span>·</span>
                        <span>{position.location}</span>
                        <span>·</span>
                        <span>{position.type}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>

            {/* No Positions Note */}
            <p className="text-center text-muted-foreground mt-8 text-sm">
              Don't see a position that fits? Send your portfolio to{' '}
              <a href="mailto:careers@rdctextiles.com" className="text-foreground hover:underline">
                careers@rdctextiles.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
