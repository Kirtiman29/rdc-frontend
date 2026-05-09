// src/components/home/HeroEditorial
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, Palette, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDesigns } from '@/api/designApi';
import { getAssetUrl } from '@/api/apiClient';
import type { Design } from '@/types/product';
import { motion } from 'framer-motion';
import { getProductPath } from '@/utils/routes';

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
    <section className="relative w-full overflow-hidden bg-[#FDFCFB] flex items-center lg:min-h-[85vh]">
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

      <div className="container relative z-10 mx-auto px-4 py-10 sm:px-6 sm:py-12 md:px-8 lg:py-14 xl:px-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Content */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-6 text-center sm:items-start sm:text-left sm:space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#BA1B1C]/10 bg-white/60 px-3 py-2 text-xs font-medium text-[#BA1B1C] shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-md sm:px-4 md:text-sm"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wide sm:text-xs">India's Premier Design Platform</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group text-3xl font-serif leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Crafting <br className="hidden sm:block" />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 italic font-light text-[#BA1B1C] transition-colors duration-500 group-hover:text-[#8E1415] hover:text-[#8E1415]">Tomorrow's</span>
                <span className="absolute bottom-1 left-0 h-2 w-full bg-[#BA1B1C]/10 transition-all duration-500 ease-out group-hover:h-6 group-hover:bg-[#BA1B1C]/20 sm:bottom-2 sm:h-3" />
              </span>
              <br className="hidden sm:block" />
              <span className="font-semibold">Textile Heritage</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-xl text-sm font-light leading-relaxed text-slate-600 sm:text-base md:text-lg"
            >
              Discover an exclusive collection of premium textile designs. Bridge traditional artistry with next-generation AI infrastructure to elevate your creative vision.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex w-full flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:gap-4 sm:pt-4"
            >
              <Button
                onClick={() => navigate('/gallery')}
                className="group relative w-full overflow-hidden rounded-full bg-[#BA1B1C] px-6 py-5 text-sm font-medium text-white shadow-xl shadow-[#BA1B1C]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#8E1415] hover:shadow-2xl hover:shadow-[#BA1B1C]/40 sm:w-auto sm:px-8 sm:py-6 sm:text-base"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center justify-center">
                  Explore Collection
                  <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <Button
                onClick={() => navigate('/ai-studio')}
                variant="outline"
                className="group w-full rounded-full border-2 border-slate-200 bg-white/50 px-6 py-5 text-sm font-medium text-slate-700 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#BA1B1C] hover:bg-[#BA1B1C] hover:text-white hover:shadow-lg hover:shadow-[#BA1B1C]/20 sm:w-auto sm:px-8 sm:py-6 sm:text-base"
              >
                Try AI Studio
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="hidden w-full max-w-xl grid-cols-1 gap-3 border-t border-slate-200/60 pt-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:pt-8"
            >
              {[
                { icon: Palette, label: "10k+ Designs", sub: "Curated" },
                { icon: Zap, label: "AI Powered", sub: "Tools" },
                { icon: Sparkles, label: "Premium", sub: "Quality" }
              ].map((stat, i) => (
                <div key={i} className="group flex flex-row items-center gap-3 rounded-xl border border-transparent p-3 transition-all duration-300 hover:border-slate-100 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 sm:-m-3 sm:flex-col sm:items-start sm:gap-0 sm:space-y-1">
                  <div className="p-2 bg-slate-100 group-hover:bg-[#BA1B1C]/10 rounded-lg text-[#BA1B1C] mb-1 transition-colors duration-300 transform group-hover:scale-110">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 transition-colors duration-300 group-hover:text-[#BA1B1C]">{stat.label}</span>
                    <span className="text-xs text-slate-500">{stat.sub}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Content - Elegant Masonry / Floating Cards */}
          <div className="group/masonry relative mt-2 hidden h-auto min-h-[320px] w-full sm:block sm:min-h-[420px] lg:col-span-6 lg:mt-0 lg:h-[700px]">
            {featuredDesigns.length >= 3 && (
              <div className="grid w-full grid-cols-2 auto-rows-[150px] gap-3 sm:auto-rows-[200px] sm:gap-4 lg:absolute lg:inset-0 lg:block lg:h-full">
                {/* Main large image */}
                <Link to={getProductPath(featuredDesigns[0])}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: [-2, 0, -2] }}
                    whileHover={{ scale: 1.05, rotate: 0, zIndex: 50 }}
                    transition={{ duration: 0.8, rotate: { repeat: Infinity, duration: 8, ease: "easeInOut" } }}
                    className="relative col-span-2 row-span-2 overflow-hidden rounded-2xl border-4 border-white shadow-2xl transition-opacity duration-300 cursor-pointer group-hover/masonry:opacity-75 hover:!opacity-100 lg:absolute lg:top-[10%] lg:right-[10%] lg:h-[65%] lg:w-[55%] lg:z-20"
                  >
                    <img src={getAssetUrl(featuredDesigns[0].assetUuid)} alt={featuredDesigns[0].title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 translate-y-2 hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white font-medium text-sm md:text-base truncate drop-shadow-md">{featuredDesigns[0].title}</p>
                    </div>
                  </motion.div>
                </Link>

                {/* Secondary image left */}
                <Link to={getProductPath(featuredDesigns[1])}>
                  <motion.div 
                    initial={{ opacity: 0, x: -50, y: 50 }}
                    animate={{ opacity: 1, x: 0, y: 0, rotate: [5, 2, 5] }}
                    whileHover={{ scale: 1.1, rotate: 0, zIndex: 50 }}
                    transition={{ duration: 0.8, delay: 0.2, rotate: { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 } }}
                    className="relative col-span-1 row-span-1 overflow-hidden rounded-2xl border-4 border-white shadow-xl transition-opacity duration-300 cursor-pointer group-hover/masonry:opacity-75 hover:!opacity-100 lg:absolute lg:bottom-[10%] lg:left-[5%] lg:h-[45%] lg:w-[45%] lg:z-30"
                  >
                    <img src={getAssetUrl(featuredDesigns[1].assetUuid)} alt={featuredDesigns[1].title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-40 hover:opacity-0 transition-opacity duration-300" />
                  </motion.div>
                </Link>

                {/* Tertiary image top right behind */}
                <Link to={getProductPath(featuredDesigns[2])}>
                  <motion.div 
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0, rotate: [10, 12, 10] }}
                    whileHover={{ scale: 1.1, rotate: 0, zIndex: 50 }}
                    transition={{ duration: 0.8, delay: 0.4, rotate: { repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 } }}
                    className="relative col-span-1 row-span-1 overflow-hidden rounded-2xl border-4 border-white opacity-90 shadow-lg transition-opacity duration-300 cursor-pointer group-hover/masonry:opacity-75 hover:!opacity-100 lg:absolute lg:top-[0%] lg:right-[5%] lg:h-[40%] lg:w-[40%] lg:z-10"
                  >
                    <img src={getAssetUrl(featuredDesigns[2].assetUuid)} alt={featuredDesigns[2].title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors duration-300" />
                  </motion.div>
                </Link>
                
                {/* 4th image small floating bottom right */}
                {featuredDesigns[3] && (
                  <Link to={getProductPath(featuredDesigns[3])}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1, y: [0, -15, 0] }}
                      whileHover={{ scale: 1.15, zIndex: 50 }}
                      transition={{ duration: 0.8, delay: 0.5, y: { repeat: Infinity, duration: 5, ease: "easeInOut" } }}
                      className="relative col-span-2 row-span-1 overflow-hidden rounded-xl border-[3px] border-white shadow-2xl transition-opacity duration-300 cursor-pointer group-hover/masonry:opacity-75 hover:!opacity-100 lg:absolute lg:right-[-5%] lg:bottom-[20%] lg:h-[25%] lg:w-[25%] lg:z-40"
                    >
                      <img src={getAssetUrl(featuredDesigns[3].assetUuid)} alt={featuredDesigns[3].title} className="w-full h-full object-cover" />
                    </motion.div>
                  </Link>
                )}

                {/* Decorative element */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-[20%] left-[20%] hidden h-24 w-24 rounded-full border border-[#BA1B1C]/20 border-dashed z-0 lg:block"
                />
              </div>
            )}
            
            {featuredDesigns.length < 3 && featuredDesigns.length > 0 && (
              <div className="flex justify-center items-center h-full gap-4 group/masonry">
                {featuredDesigns.map((design) => (
                  <Link key={design.id} to={getProductPath(design)} className="w-1/2 aspect-[3/4]">
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
