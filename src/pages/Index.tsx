import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroEditorial from '@/components/home/HeroEditorial';
import TrendingDesigns from '@/components/home/TrendingDesigns';
import PremiumDesigns from '@/components/home/PremiumDesigns';
import EditorsChoice from '@/components/home/EditorsChoice';
import ShopByCategory from '@/components/home/ShopByCategory';
import NewArrivals from '@/components/home/NewArrivals';
import SpecialOffers from '@/components/home/SpecialOffers';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-slate-100">
      <Header />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* 🔥 SEO H1 (Hidden but crawlable) */}
        <h1 className="sr-only">
          Premium Textile Design Marketplace - Ruchita Design Company
        </h1>

        {/* 🔥 SEO Content (hidden but useful) */}
        <div className="sr-only">
          <p>
            Ruchita Design Company (RDC) is a premium textile design marketplace
            offering high-quality fabric patterns for fashion designers, garment
            manufacturers, and textile printing businesses. Explore a wide range
            of luxury textile designs, trending patterns, and exclusive fabric
            artwork for commercial and creative use.
          </p>
        </div>

        <div className="relative z-10">
          <HeroEditorial />
        </div>

        <div className="relative -mt-1 shadow-sm z-20">
          <TrendingDesigns />
        </div>

        <div className="w-full">
          <ShopByCategory />
        </div>

        <div className="w-full">
          <PremiumDesigns />
        </div>

        <div className="w-full">
          <EditorsChoice />
        </div>

        <div className="w-full">
          <NewArrivals />
        </div>

        <div className="w-full pb-12 lg:pb-20">
          <SpecialOffers />
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Index;