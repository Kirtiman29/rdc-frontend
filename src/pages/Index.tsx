import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroEditorial from '@/components/home/HeroEditorial';
import TrendingDesigns from '@/components/home/TrendingDesigns';
import PremiumDesigns from '@/components/home/PremiumDesigns';
import EditorsChoice from '@/components/home/EditorsChoice';
import ShopByCategory from '@/components/home/ShopByCategory';
import NewArrivals from '@/components/home/NewArrivals';
import SpecialOffers from '@/components/home/SpecialOffers';
import SubscriptionSection from '@/components/home/SubscriptionSection';
import AIStudioSection from '@/components/home/AIStudioSection';
import TrustedPartners from '@/components/home/TrustedPartners';
import Testimonial from '@/components/home/Testimonial';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-slate-100">
      <Header />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* 🔥 SEO H1 */}
        <h1 className="sr-only">
          Premium Textile Design Marketplace - Ruchita Design Company
        </h1>

        {/* 🔥 SEO Content */}
        <div className="sr-only">
          <p>
            Ruchita Design Company (RDC) is a premium textile design marketplace
            offering high-quality fabric patterns for fashion designers, garment
            manufacturers, and textile printing businesses.
          </p>
        </div>

        {/* HERO */}
        <div className="relative z-10">
          <HeroEditorial />
        </div>

        {/* TRENDING */}
        <div className="relative -mt-1 shadow-sm z-20">
          <TrendingDesigns />
        </div>

        {/* CATEGORY */}
        <div className="w-full">
          <ShopByCategory />
        </div>

        {/* 🔥 NEW SECTION: SUBSCRIPTION */}
        <div className="w-full">
          <SubscriptionSection />
        </div>

        

        {/* PREMIUM */}
        <div className="w-full">
          <PremiumDesigns />
        </div>

        {/* EDITORS */}
        <div className="w-full">
          <EditorsChoice />
        </div>

        {/* 🔥 NEW SECTION: AI STUDIO */}
        <div className="w-full">
          <AIStudioSection />
        </div>

        {/* NEW ARRIVALS */}
        <div className="w-full">
          <NewArrivals />
        </div>

        {/* OFFERS */}
        <div className="w-full pb-12 lg:pb-20">
          <SpecialOffers />
        </div>

        {/* TESTIMONIAL */}
        <div className="w-full">
          <Testimonial />
        </div>

      {/* PARTNERS */}
        <div className="w-full">
          <TrustedPartners />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;