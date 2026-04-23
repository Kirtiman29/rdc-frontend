// src/components/home/HeroEditorial
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, Palette, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const HeroEditorial = () => {
  const navigate = useNavigate();
  const [featuredDesigns, setFeaturedDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedDesigns = async () => {
      try {
        const response: any = await getDesigns({ size: 6 });
        const designs = response?.content || (Array.isArray(response) ? response : []);
        setFeaturedDesigns(designs.slice(0, 4)); // Using 4 designs for a richer layout
      } catch (error) {
        console.error('Failed to fetch featured designs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedDesigns();
  }, []);

  if (loading) return (
    <div className="flex h-[75vh] items-center justify-center bg-[#FDFCFB]">
      <Loader2 className="h-10 w-10 animate-spin text-[#BA1B1C]" />
    </div>
  );

  return (
    <section className="relative w-full min-h-[85vh] bg-[#FDFCFB] overflow-hidden flex items-center">
      {/* Abstract Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#BA1B1C]/10 to-transparent blur-3xl"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-t from-[#BA1B1C]/5 to-transparent blur-3xl"
        />
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#BA1B1C 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="container mx-auto px-4 md:px-8 xl:px-12 relative z-10 py-12 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-[#BA1B1C]/10 text-[#BA1B1C] text-xs md:text-sm font-medium rounded-full shadow-sm hover:shadow-md hover:bg-white cursor-pointer transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="tracking-wide uppercase text-xs font-semibold">India's Premier Design Platform</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-serif text-slate-900 leading-[1.1] tracking-tight group"
            >
              Crafting <br className="hidden md:block" />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 italic font-light text-[#BA1B1C] transition-colors duration-500 group-hover:text-[#8E1415] hover:text-[#8E1415]">Tomorrow's</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-[#BA1B1C]/10 -z-10 transition-all duration-500 ease-out group-hover:h-6 group-hover:bg-[#BA1B1C]/20" />
              </span>
              <br className="hidden md:block" />
              <span className="font-semibold">Textile Heritage</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-slate-600 leading-relaxed max-w-lg font-light"
            >
              Discover an exclusive collection of premium textile designs. Bridge traditional artistry with next-generation AI infrastructure to elevate your creative vision.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Button
                onClick={() => navigate('/gallery')}
                className="group relative overflow-hidden bg-[#BA1B1C] hover:bg-[#8E1415] text-white px-8 py-6 text-base font-medium rounded-full shadow-xl shadow-[#BA1B1C]/20 transition-all duration-300 hover:shadow-2xl hover:shadow-[#BA1B1C]/40 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center">
                  Explore Collection
                  <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <Button
                onClick={() => navigate('/ai-studio')}
                variant="outline"
                className="group border-2 border-slate-200 hover:border-[#BA1B1C] bg-white/50 backdrop-blur hover:bg-[#BA1B1C] text-slate-700 hover:text-white px-8 py-6 text-base font-medium rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#BA1B1C]/20 hover:-translate-y-1"
              >
                Try AI Studio
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200/60 w-full max-w-md"
            >
              {[
                { icon: Palette, label: "10k+ Designs", sub: "Curated" },
                { icon: Zap, label: "AI Powered", sub: "Tools" },
                { icon: Sparkles, label: "Premium", sub: "Quality" }
              ].map((stat, i) => (
                <div key={i} className="group flex flex-col items-start space-y-1 p-3 -m-3 rounded-xl hover:bg-white hover:shadow-md hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="p-2 bg-slate-100 group-hover:bg-[#BA1B1C]/10 rounded-lg text-[#BA1B1C] mb-1 transition-colors duration-300 transform group-hover:scale-110">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-[#BA1B1C] transition-colors duration-300">{stat.label}</span>
                  <span className="text-xs text-slate-500">{stat.sub}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Content - Elegant Masonry / Floating Cards */}
          <div className="lg:col-span-6 relative h-[500px] sm:h-[600px] lg:h-[700px] w-full mt-12 lg:mt-0 group/masonry">
            {featuredDesigns.length >= 3 && (
              <div className="absolute inset-0 w-full h-full">
                {/* Main large image */}
                <Link to={`/product/${featuredDesigns[0].id}`}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: [-2, 0, -2] }}
                    whileHover={{ scale: 1.05, rotate: 0, zIndex: 50 }}
                    transition={{ duration: 0.8, rotate: { repeat: Infinity, duration: 8, ease: "easeInOut" } }}
                    className="absolute top-[10%] right-[10%] w-[55%] h-[65%] rounded-2xl overflow-hidden shadow-2xl z-20 border-4 border-white cursor-pointer group-hover/masonry:opacity-75 hover:!opacity-100 transition-opacity duration-300"
                  >
                    <img src={getAssetUrl(featuredDesigns[0].assetUuid)} alt={featuredDesigns[0].title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 translate-y-2 hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white font-medium text-sm md:text-base truncate drop-shadow-md">{featuredDesigns[0].title}</p>
                    </div>
                  </motion.div>
                </Link>

                {/* Secondary image left */}
                <Link to={`/product/${featuredDesigns[1].id}`}>
                  <motion.div 
                    initial={{ opacity: 0, x: -50, y: 50 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: [5, 2, 5] }}
                    whileHover={{ scale: 1.1, rotate: 0, zIndex: 50 }}
                    transition={{ duration: 0.8, delay: 0.2, rotate: { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 } }}
                    className="absolute bottom-[10%] left-[5%] w-[45%] h-[45%] rounded-2xl overflow-hidden shadow-xl z-30 border-4 border-white cursor-pointer group-hover/masonry:opacity-75 hover:!opacity-100 transition-opacity duration-300"
                  >
                    <img src={getAssetUrl(featuredDesigns[1].assetUuid)} alt={featuredDesigns[1].title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-40 hover:opacity-0 transition-opacity duration-300" />
                  </motion.div>
                </Link>

                {/* Tertiary image top right behind */}
                <Link to={`/product/${featuredDesigns[2].id}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0, rotate: [10, 12, 10] }}
                    whileHover={{ scale: 1.1, rotate: 0, zIndex: 50 }}
                    transition={{ duration: 0.8, delay: 0.4, rotate: { repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 } }}
                    className="absolute top-[0%] right-[5%] w-[40%] h-[40%] rounded-2xl overflow-hidden shadow-lg z-10 border-4 border-white opacity-90 cursor-pointer group-hover/masonry:opacity-75 hover:!opacity-100 transition-opacity duration-300"
                  >
                    <img src={getAssetUrl(featuredDesigns[2].assetUuid)} alt={featuredDesigns[2].title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors duration-300" />
                  </motion.div>
                </Link>
                
                {/* 4th image small floating bottom right */}
                {featuredDesigns[3] && (
                  <Link to={`/product/${featuredDesigns[3].id}`}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1, y: [0, -15, 0] }}
                      whileHover={{ scale: 1.15, zIndex: 50 }}
                      transition={{ duration: 0.8, delay: 0.5, y: { repeat: Infinity, duration: 5, ease: "easeInOut" } }}
                      className="absolute bottom-[20%] right-[-5%] w-[25%] h-[25%] rounded-xl overflow-hidden shadow-2xl z-40 border-[3px] border-white cursor-pointer group-hover/masonry:opacity-75 hover:!opacity-100 transition-opacity duration-300"
                    >
                      <img src={getAssetUrl(featuredDesigns[3].assetUuid)} alt={featuredDesigns[3].title} className="w-full h-full object-cover" />
                    </motion.div>
                  </Link>
                )}

                {/* Decorative element */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-[20%] left-[20%] w-24 h-24 border border-[#BA1B1C]/20 rounded-full border-dashed z-0"
                />
              </div>
            )}
            
            {featuredDesigns.length < 3 && featuredDesigns.length > 0 && (
              <div className="flex justify-center items-center h-full gap-4 group/masonry">
                {featuredDesigns.map((design) => (
                  <Link key={design.id} to={`/product/${design.id}`} className="w-1/2 aspect-[3/4]">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.05 }}
                      className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white cursor-pointer group-hover/masonry:opacity-75 hover:!opacity-100 transition-opacity duration-300"
                    >
                      <img src={getAssetUrl(design.assetUuid)} alt={design.title} className="w-full h-full object-cover" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroEditorial;