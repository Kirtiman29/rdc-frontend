import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, ChevronRight, Loader2, User } from 'lucide-react';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { getAssetUrl } from '@/api/apiClient';
import { getPublishedBlogBySlugOrId, type PublicBlog } from '@/api/blogApi';
import { useCanonicalLink } from '@/hooks/useCanonicalLink';
import { getBlogPath } from '@/utils/routes';

const hasHtml = (value: string) => /<[a-z][\s\S]*>/i.test(value);

const formatBlogDate = (date?: string) => {
  if (!date) return 'Recently published';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
};

const getBlogImage = (image?: string) => {
  if (!image) return undefined;
  return image.startsWith('http') ? image : getAssetUrl(image);
};

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [blog, setBlog] = useState<PublicBlog | null>(null);
  const [loading, setLoading] = useState(true);

  const canonicalPath = blog ? getBlogPath(blog) : undefined;
  const canonicalUrl =
    canonicalPath && typeof window !== 'undefined' ? `${window.location.origin}${canonicalPath}` : undefined;

  useCanonicalLink(canonicalUrl);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;

      setLoading(true);

      try {
        const blogData = await getPublishedBlogBySlugOrId(slug);
        setBlog(blogData);

        if (blogData.slug && slug !== blogData.slug) {
          navigate(getBlogPath(blogData), { replace: true });
        }
      } catch (error) {
        console.error('Failed to load public blog:', error);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchBlog();
  }, [navigate, slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center px-6 py-20">
          <div className="w-full max-w-xl rounded-sm border border-zinc-200 bg-zinc-50 p-8 text-center">
            <h1 className="text-3xl font-serif text-[#2A2623]">Blog unavailable</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              We could not load this editorial story right now.
            </p>
            <Link
              to="/blogs"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-sm bg-[#2A2623] px-6 text-[10px] font-bold uppercase tracking-[0.24em] text-white hover:bg-black"
            >
              Back to Blogs
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const articleImage = getBlogImage(blog.image);
  const articleBody = blog.content || blog.excerpt;
  const formattedDate = formatBlogDate(blog.publishedAt);

  return (
    <div className="flex min-h-screen flex-col bg-[#FBFAF9] text-[#2A2623]">
      <Header />
      <main className="flex-1">
        <section className="border-b border-zinc-100 bg-white py-4">
          <div className="container mx-auto px-6 md:px-8">
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
              <Link to="/" className="hover:text-[#2A2623]">Home</Link>
              <ChevronRight size={12} />
              <Link to="/blogs" className="hover:text-[#2A2623]">Blogs</Link>
              <ChevronRight size={12} />
              <span className="text-[#2A2623]">{blog.title}</span>
            </nav>
          </div>
        </section>

        <article className="container mx-auto px-6 py-12 md:px-8 md:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 space-y-5">
              <span className="inline-flex rounded-full bg-[#212328] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white">
                {blog.category || 'Editorial'}
              </span>
              <h1 className="font-serif text-4xl leading-tight text-[#2A2623] md:text-6xl">
                {blog.title}
              </h1>
              <div className="flex flex-wrap items-center gap-5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                <span className="flex items-center gap-2">
                  <Calendar size={14} />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-2">
                  <User size={14} />
                  {blog.author || 'RDC Editorial'}
                </span>
              </div>
            </div>

            {articleImage && (
              <div className="mb-10 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
                <img src={articleImage} alt={blog.title} className="h-full w-full object-cover" />
              </div>
            )}

            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-100 md:p-12">
              {hasHtml(articleBody) ? (
                <div
                  className="prose prose-zinc max-w-none prose-headings:font-serif prose-p:text-zinc-700"
                  dangerouslySetInnerHTML={{ __html: articleBody }}
                />
              ) : (
                <div className="space-y-5 text-[15px] leading-8 text-zinc-700">
                  {articleBody
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((line, index) => (
                      <p key={`${line}-${index}`}>{line}</p>
                    ))}
                </div>
              )}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetail;
