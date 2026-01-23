import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import ValueProposition from '@/components/home/ValueProposition';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import InDetailsSection from '@/components/home/InDetailsSection';
import Testimonial from '@/components/home/Testimonial';
import CallToAction from '@/components/home/CallToAction';

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ValueProposition />
        <FeaturedCategories />
        <FeaturedProducts />
        <InDetailsSection />
        <Testimonial />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
