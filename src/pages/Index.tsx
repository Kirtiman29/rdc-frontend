import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroEditorial from '@/components/home/Homebanner';
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
import ShopBySegment from '@/components/home/ShopBySegment';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-slate-100">
      <Header />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HERO */}
        <HeroEditorial />

        {/* TRENDING */}
        <TrendingDesigns />

        {/* SEGMENT */}
        <ShopBySegment />

        {/* PREMIUM */}
        <PremiumDesigns />

        {/* CATEGORY */}
        <ShopByCategory />

        {/* EDITORS */}
        <EditorsChoice />

        {/* AI STUDIO */}
        <AIStudioSection />

        {/* NEW ARRIVALS */}
        <NewArrivals />

        {/* SUBSCRIPTION */}
        <SubscriptionSection />

        {/* OFFERS */}
        <SpecialOffers />

        {/* TESTIMONIAL */}
        <Testimonial />

        {/* PARTNERS */}
        <TrustedPartners />

      </main>

      <Footer />
    </div>
  );
};

export default Index;
