// src/pages/Index.tsx
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
        <HeroEditorial />
        <TrendingDesigns />
        <PremiumDesigns />
        <EditorsChoice />
        <ShopByCategory />
        <NewArrivals />
        <SpecialOffers />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
