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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* 1. Impact Entry */}
        <HeroEditorial />
        
        {/* 2. Immediate Social Proof / Trends */}
        <TrendingDesigns />
        
        {/* 3. Break up the grids with a different visual style (Categories) */}
        <ShopByCategory />
        
        {/* 4. Luxury Highlight (Dark themed section) */}
        <PremiumDesigns />
        
        {/* 5. Curated Content */}
        <EditorsChoice />
        
        {/* 6. Fresh Updates */}
        <NewArrivals />
        
        {/* 7. Conversion Closer (Promotional) */}
        <SpecialOffers />
      </main>
      <Footer />
    </div>
  );
};

export default Index;