import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Fabrics = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4F0]">

      <Header />

      <main className="flex-1 relative overflow-hidden">

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* CONTENT */}
        <section className="container px-4 md:px-6 mx-auto max-w-3xl relative z-10 text-center pt-24 md:pt-32 pb-20">

          <span className="inline-block mb-6 text-xs uppercase tracking-[0.4em] text-neutral-400 font-medium">
            COMING SOON
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium leading-tight tracking-tight mb-6 text-[#2A2623]">
            Fabrics by the Meter
          </h1>

          <div className="w-12 h-[1px] bg-neutral-300 mx-auto mb-6" />

          <p className="text-base md:text-lg text-neutral-600 leading-relaxed mb-6">
            Soon, you’ll be able to purchase premium textile fabrics directly in meters—
            designed for fashion brands, designers, and manufacturers.
          </p>

          <p className="text-sm text-neutral-400 leading-relaxed max-w-xl mx-auto">
            Built for precision, quality, and real-world production. RDC Fabrics will bridge
            design and manufacturing like never before.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#BA1B1C] animate-pulse" />
            <span className="text-xs uppercase tracking-[0.3em] text-neutral-400">
              Launching Soon
            </span>
          </div>

        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Fabrics;