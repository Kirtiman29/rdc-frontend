import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getPublishedBlogs, type PublicBlog } from "@/api/blogApi";
import { getAssetUrl } from "@/api/apiClient";
import { getBlogPath } from "@/utils/routes";

import pattern1 from "@/assets/sample-pattern-1.jpg";
import pattern2 from "@/assets/sample-pattern-2.jpg";
import pattern3 from "@/assets/sample-pattern-3.jpg";
import pattern4 from "@/assets/sample-pattern-4.jpg";

import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Loader2,
  User,
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

const estimateReadTime = (value: string | undefined) => {
  const text = (value || "").replace(/<[^>]*>/g, " ").trim();
  const words = text ? text.split(/\s+/).length : 120;
  return `${Math.max(2, Math.ceil(words / 180))} min read`;
};

const mapPublicBlogToArticle = (blog: PublicBlog, index: number) => ({
  id: blog.id,
  slug: blog.slug,
  featured: blog.featured,
  category: blog.category || "Editorial",
  title: blog.title,
  excerpt: blog.excerpt,
  image: getBlogImage(blog.image, index),
  author: blog.author || "RDC Editorial",
  date: formatBlogDate(blog.publishedAt),
  readTime: estimateReadTime(blog.content || blog.excerpt),
});

const BLOG_ARTICLES_DATA = [
  {
    id: 1,
    slug: "counterintuitive-networking-strategies-for-designers",
    featured: true,
    category: "Creative Entrepreneurship",
    title: "Counterintuitive Networking Strategies for Designers",
    excerpt:
      "Malko Sakai is the founder of Airtight Concepts, a business consulting firm that specializes in eliminating business stagnation and helping creative studios move with more intention.",
    image: pattern1,
    author: "Malko Sakai",
    date: "April 2, 2026",
    readTime: "4 min read",
  },
  {
    id: 2,
    slug: "painting-murals-sculpture-and-more-with-hello-kirsten",
    category: "Artistic Style",
    title: "Painting, Murals, Sculpture and More with Hello Kirsten",
    excerpt:
      "Hello Kirsten is a muralist and fine artist working in Toronto, Canada. She mixes patterns, rich palettes, and tactile mark-making into work that feels instantly collectible.",
    image: pattern2,
    author: "Kirsten",
    date: "March 28, 2026",
    readTime: "3 min read",
  },
  {
    id: 3,
    slug: "mixing-analog-digital-printing-techniques-for-fabric",
    category: "Textile History",
    title: "Mixing Analog and Digital Printing Techniques for Fabric",
    excerpt:
      "Kineret Enoch is a textile and surface pattern designer with deep experience developing prints and collections that bridge hand processes with production-ready systems.",
    image: pattern3,
    author: "Kineret Enoch",
    date: "March 15, 2026",
    readTime: "5 min read",
  },
  {
    id: 4,
    slug: "joy-patterned-filled-homes-from-megan-kelso",
    category: "Home Decor",
    title: "Joy and Pattern-Filled Homes from Megan Kelso",
    excerpt:
      "Megan Kelso creates hand-painted artwork for interior textiles and wallpaper in the high desert of Oregon, translating warmth and personality into repeatable decorative stories.",
    image: pattern4,
    author: "Megan Kelso",
    date: "March 10, 2026",
    readTime: "3 min read",
  },
];

export default function Blog() {
  const [blogs, setBlogs] = useState<PublicBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const publishedBlogs = await getPublishedBlogs();
        if (isMounted) {
          setBlogs(publishedBlogs);
        }
      } catch (error) {
        console.error("Failed to load public blogs:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const articles = blogs.length > 0 ? blogs.map(mapPublicBlogToArticle) : BLOG_ARTICLES_DATA;
  const featuredArticle =
    articles.find((article) => article.featured) || articles[0];
  const supportingArticles = featuredArticle
    ? articles.filter((article) => article.id !== featuredArticle.id)
    : [];

  if (loading && blogs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFAF9]">
        <Loader2 className="h-10 w-10 animate-spin text-[#C5A059]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FBFAF9] text-[#2A2623]">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[#E8E1D4] bg-[radial-gradient(circle_at_top_left,_rgba(197,160,89,0.16),_transparent_38%),linear-gradient(180deg,#FBFAF9_0%,#F3EEE4_100%)]">
          <div className="container mx-auto px-4 py-10 md:px-8 md:py-12">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A059]">
                RDC Journal
              </p>
              <h1 className="mt-3 font-serif text-3xl leading-tight text-[#2A2623] md:text-5xl">
                Stories, insights, and visual direction from the world of textile design.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#2A2623]/68">
                A cleaner editorial space focused on the latest published articles, with the imagery and content taking the lead.
              </p>
            </div>
          </div>
        </section>

        {featuredArticle && (
          <section className="container mx-auto px-4 py-8 md:px-8 md:py-10">
            <motion.article
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-4xl overflow-hidden border border-[#E8E1D4] bg-white shadow-[0_18px_60px_rgba(42,38,35,0.07)]"
            >
              <div className="grid items-start lg:grid-cols-[320px_minmax(0,1fr)]">
                <Link
                  to={getBlogPath(featuredArticle)}
                  className="group block h-[180px] overflow-hidden bg-[#EFE9DE] md:h-[220px] lg:h-[260px]"
                >
                  <img
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.04]"
                  />
                </Link>

                <div className="flex flex-col justify-between p-5 md:p-7 lg:p-8">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2623]/55">
                      <span>{featuredArticle.category}</span>
                    </div>

                    <Link to={getBlogPath(featuredArticle)}>
                      <h2 className="max-w-2xl font-serif text-xl leading-tight text-[#2A2623] transition-colors hover:text-black md:text-2xl">
                        {featuredArticle.title}
                      </h2>
                    </Link>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-[#2A2623]/68">
                      {featuredArticle.excerpt}
                    </p>
                  </div>

                  <div className="mt-5">
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2A2623]/50">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {featuredArticle.date}
                      </span>
                      <span className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        {featuredArticle.author}
                      </span>
                      <span>{featuredArticle.readTime}</span>
                    </div>

                    <Link
                      to={getBlogPath(featuredArticle)}
                      className="inline-flex items-center gap-3 border-b border-[#2A2623]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#2A2623] transition-all hover:gap-4"
                    >
                      Read Featured Story
                      <ArrowRight className="h-4 w-4 text-[#C5A059]" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          </section>
        )}

        <section className="container mx-auto px-4 pb-20 md:px-8 md:pb-24">
          <div className="mb-10 flex flex-col gap-4 border-b border-[#E8E1D4] pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C5A059]">
                Latest Articles
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[#2A2623] md:text-4xl">
                Recent stories
              </h2>
            </div>
            <div className="max-w-xl text-sm leading-7 text-[#2A2623]/62">
              A focused feed of published blog content with a more refined, image-led layout.
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {supportingArticles.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="group overflow-hidden border border-[#E8E1D4] bg-white shadow-[0_14px_50px_rgba(42,38,35,0.05)]"
              >
                <Link to={getBlogPath(post)} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#EFE9DE]">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute left-5 top-5 bg-white/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A2623]">
                      {post.category}
                    </div>
                  </div>
                </Link>

                <div className="p-6 md:p-7">
                  <div className="mb-4 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A2623]/45">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                    <span>{post.readTime}</span>
                  </div>

                  <Link to={getBlogPath(post)}>
                    <h3 className="font-serif text-2xl leading-tight text-[#2A2623] transition-colors group-hover:text-black">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="mt-4 text-sm leading-7 text-[#2A2623]/64 line-clamp-4">
                    {post.excerpt}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#E8E1D4] pt-5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2A2623]/45">
                      {post.author}
                    </span>
                    <Link
                      to={getBlogPath(post)}
                      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#2A2623] transition-all hover:gap-3"
                    >
                      Read More
                      <ChevronRight className="h-4 w-4 text-[#C5A059]" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
