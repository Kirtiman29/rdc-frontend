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
      
      {/* Main container with 'flex flex-col' and no internal gaps.
          We use a standard background color to ensure no 'cracks' 
          show between sections.
      */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* 1. Impact Entry */}
        <div className="relative z-10">
          <HeroEditorial />
        </div>
        
        {/* Spacing Fix: Wrappers with negative margin or tight padding control.
            If your sections have 'py-24', these wrappers help visually 
            pull them together.
        */}
        
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