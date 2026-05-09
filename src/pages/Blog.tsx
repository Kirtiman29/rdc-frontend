import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Importing your actual layout components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getPublishedBlogs, type PublicBlog } from "@/api/blogApi";
import { getAssetUrl } from "@/api/apiClient";
import { getBlogPath } from "@/utils/routes";

// Assets
import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";

import { 
  ArrowRight, 
  Calendar, 
  User, 
  ChevronRight,
  Sparkles,
  Zap,
  BookOpen
} from "lucide-react";

const fallbackImages = [pattern1, pattern2, pattern3, pattern4];

const getBlogImage = (image: string | undefined, fallbackIndex: number) => {
  if (!image) return fallbackImages[fallbackIndex % fallbackImages.length];

  if (image.startsWith("http") && !image.includes("/api/assets/")) {
    return image;
  }

  return getAssetUrl(image);
};

const formatBlogDate = (date: string | undefined) => {
  if (!date) return "Recently Published";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const mapPublicBlogToArticle = (blog: PublicBlog, index: number) => ({
  id: blog.id,
  slug: blog.slug,
  category: blog.category || "Editorial",
  title: blog.title,
  excerpt: blog.excerpt,
  image: getBlogImage(blog.image, index),
  author: blog.author || "RDC Editorial",
  date: formatBlogDate(blog.publishedAt),
});

const BLOG_ARTICLES_DATA = [
  {
    id: 1,
    slug: "counterintuitive-networking-strategies-for-designers",
    category: "Creative Entrepreneurship",
    title: "Counterintuitive Networking Strategies for Designers",
    excerpt: "Malko Sakai is the founder of Airtight Concepts, a business consulting firm that specializes in eliminating business stagnation...",
    image: pattern1,
    author: "Malko Sakai",
    date: "April 2, 2026"
  },
  {
    id: 2,
    slug: "painting-murals-sculpture-and-more-with-hello-kirsten",
    category: "Artistic Style",
    title: "Painting, Murals, Sculpture and more with Hello Kirsten",
    excerpt: "Hello Kirsten is a muralist and fine artist working in Toronto, Canada. She mixes patterns and interesting color palettes...",
    image: pattern2,
    author: "Kirsten",
    date: "March 28, 2026"
  },
  {
    id: 3,
    slug: "mixing-analog-digital-printing-techniques-for-fabric",
    category: "Textile History",
    title: "Mixing Analog + Digital Printing Techniques for Fabric",
    excerpt: "Kineret Enoch is a textile and surface pattern designer with over 15 years of experience developing prints and textile collections...",
    image: pattern3,
    author: "Kineret Enoch",
    date: "March 15, 2026"
  },
  {
    id: 4,
    slug: "joy-patterned-filled-homes-from-megan-kelso",
    category: "Home Decor",
    title: "Joy & Patterned Filled Homes From Megan Kelso",
    excerpt: "Megan Kelso creates hand-painted artwork for interior textiles and wallpaper in the high desert of Oregon. In college, Megan majored...",
    image: pattern4,
    author: "Megan Kelso",
    date: "March 10, 2026"
  }
];

const SIDEBAR_TOPICS = [
  "Textile Design Lab",
  "Trend Certification",
  "Pattern Directory",
  "AI in Textile Design",
  "Creative Business"
];

export default function Blog() {
  const [blogs, setBlogs] = useState<PublicBlog[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchBlogs = async () => {
      try {
        const publishedBlogs = await getPublishedBlogs();
        if (isMounted) {
          setBlogs(publishedBlogs);
        }
      } catch (error) {
        console.error("Failed to load public blogs:", error);
      }
    };

    fetchBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const articles = blogs.length > 0
    ? blogs.map(mapPublicBlogToArticle)
    : BLOG_ARTICLES_DATA;

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      {/* 1. YOUR HEADER */}
      <Header />

      <main className="flex-1">
        {/* --- HERO BANNER --- */}
        <div className="bg-[#F5F4F0] border-b border-neutral-100 py-16">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#212328] text-white text-[10px] font-bold tracking-[0.2em] uppercase mb-6"
            >
              <Zap size={12} className="fill-current" /> Editorial Feed
            </motion.div>
            <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-tight text-[#2A2623] uppercase">
              Pattern <span className="text-neutral-400 font-light italic">Observer</span>
            </h1>
            <p className="mt-4 text-neutral-500 text-xs uppercase tracking-[0.4em] font-semibold">
              Insight for the <span className="text-[#2A2623]">Modern Textile Designer</span>
            </p>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="container mx-auto px-4 md:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* LEFT: ARTICLES */}
            <div className="lg:col-span-8 space-y-20">
              {articles.map((post, index) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="grid md:grid-cols-2 gap-10 items-start">
                    <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-white border border-neutral-100 shadow-sm">
                      <Link to={getBlogPath(post)} className="block h-full">
                        <img 
                          src={post.image} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                      </Link>
                      <div className="absolute top-6 left-6">
                        <span className="bg-white/95 backdrop-blur px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm border border-neutral-100">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center h-full space-y-5">
                      <div className="flex items-center gap-5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Calendar size={14} /> {post.date}</span>
                        <span className="flex items-center gap-2"><User size={14} /> {post.author}</span>
                      </div>
                      <Link to={getBlogPath(post)}>
                        <h2 className="font-serif text-3xl text-[#2A2623] leading-[1.1] group-hover:text-black transition-colors">
                          {post.title}
                        </h2>
                      </Link>
                      <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="pt-2">
                        <Link to={getBlogPath(post)} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2A2623] group-hover:translate-x-2 transition-all">
                          Read Full Story <ArrowRight size={16} className="text-[#ff1a1a]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}

              <div className="pt-12 flex justify-center border-t border-neutral-100">
                <button className="group relative px-12 py-4 bg-[#212328] text-white rounded-md font-bold text-xs uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-black active:scale-95">
                  <span className="relative z-10 flex items-center gap-3">
                    Older Posts <BookOpen size={16} />
                  </span>
                </button>
              </div>
            </div>

            {/* RIGHT: SIDEBAR */}
            <aside className="lg:col-span-4 space-y-14">
              
              {/* Call to Action: The Lab */}
              <div className="p-10 bg-[#212328] rounded-2xl text-white space-y-8 relative overflow-hidden group shadow-xl">
                <div className="w-14 h-14 rounded-full bg-[#E5F7F6]/10 flex items-center justify-center text-[#E5F7F6]">
                  <Sparkles size={28} />
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-serif text-2xl leading-tight">Textile Design <span className="text-neutral-400 italic">Lab</span></h3>
                  <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                    Join our professional community to transform your artwork into marketable patterns.
                  </p>
                </div>
                
                <button className="w-full py-4 bg-white text-[#212328] rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-[#E5F7F6] transition-all">
                  Start Learning Now
                </button>
              </div>

              {/* Topics */}
              <div className="px-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400 mb-8 flex items-center gap-4">
                  Topics <div className="h-[1px] flex-1 bg-neutral-100" />
                </h4>
                <ul className="space-y-6">
                  {SIDEBAR_TOPICS.map((topic) => (
                    <li key={topic} className="flex items-center justify-between group cursor-pointer">
                      <span className="text-xs font-bold text-neutral-500 group-hover:text-black transition-colors uppercase tracking-widest">{topic}</span>
                      <ChevronRight size={16} className="text-neutral-200 group-hover:text-black group-hover:translate-x-1 transition-all" />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div className="p-10 border border-neutral-200 rounded-2xl bg-white space-y-6 shadow-sm">
                <h4 className="font-serif text-lg text-[#2A2623]">The Weekly <span className="text-neutral-400 italic">Feed</span></h4>
                <p className="text-[11px] text-neutral-500 font-medium leading-relaxed uppercase tracking-widest">
                  Trends and business strategies for designers.
                </p>
                <div className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-md px-4 py-3 text-xs focus:outline-none focus:border-neutral-300 transition-all"
                  />
                  <button className="w-full py-4 bg-[#2A2623] text-white rounded-md font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all">
                    Subscribe
                  </button>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </main>

      {/* 2. SITE FOOTER */}
      <Footer />
    </div>
  );
}
