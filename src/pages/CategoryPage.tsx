import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/products/ProductCard';
import { getAssetUrl } from '@/api/apiClient';
import { getCategoryBySlugOrId, getDesigns } from '@/api/designApi';
import { useCanonicalLink } from '@/hooks/useCanonicalLink';
import type { Category, Design } from '@/types/product';
import { getCategoryPath } from '@/utils/routes';

const getCategoryImage = (imageUrl?: string) => {
  if (!imageUrl) return undefined;
  return imageUrl.startsWith('http') ? imageUrl : getAssetUrl(imageUrl);
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  const canonicalPath = category ? getCategoryPath(category) : undefined;
  const canonicalUrl =
    canonicalPath && typeof window !== 'undefined' ? `${window.location.origin}${canonicalPath}` : undefined;

  useCanonicalLink(canonicalUrl);

  useEffect(() => {
    const fetchCategoryPage = async () => {
      if (!slug) return;

      setLoading(true);

      try {
        const categoryData = await getCategoryBySlugOrId(slug);
        setCategory(categoryData);

        if (categoryData.slug && slug !== categoryData.slug) {
          navigate(getCategoryPath(categoryData), { replace: true });
        }

        const response = await getDesigns({
          categoryId: categoryData.id,
          size: 24,
          sortBy: 'createdAt,desc',
        });

        const content = Array.isArray(response) ? response : response.content || [];
        setDesigns(content);
      } catch (error) {
        console.error('Failed to load category page:', error);
        setCategory(null);
        setDesigns([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchCategoryPage();
  }, [navigate, slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center px-6 py-20">
          <div className="w-full max-w-xl rounded-sm border border-zinc-200 bg-zinc-50 p-8 text-center">
            <h1 className="text-3xl font-serif text-[#2A2623]">Category unavailable</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              We could not load this collection right now.
            </p>
            <Link
              to="/gallery"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-sm bg-[#2A2623] px-6 text-[10px] font-bold uppercase tracking-[0.24em] text-white hover:bg-black"
            >
              Back to Gallery
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryImage = getCategoryImage(category.imageUrl);

  return (
    <div className="flex min-h-screen flex-col bg-[#FBFAF9]">
      <Header />
      <main className="flex-1">
        <section className="border-b border-zinc-100 bg-white py-4">
          <div className="container mx-auto px-6 md:px-8">
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
              <Link to="/" className="hover:text-[#2A2623]">Home</Link>
              <ChevronRight size={12} />
              <Link to="/gallery" className="hover:text-[#2A2623]">Gallery</Link>
              <ChevronRight size={12} />
              <span className="text-[#2A2623]">{category.name}</span>
            </nav>
          </div>
        </section>

        <section className="border-b border-zinc-100 bg-white">
          <div className="container mx-auto grid gap-10 px-6 py-12 md:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
            <div className="space-y-5">
              <span className="inline-flex rounded-full bg-[#212328] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white">
                Category Edit
              </span>
              <h1 className="font-serif text-4xl text-[#2A2623] md:text-6xl">{category.name}</h1>
              <p className="max-w-2xl text-[15px] leading-8 text-zinc-600">
                {category.description || `Explore designs curated for the ${category.name} collection.`}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                {designs.length} designs available
              </p>
            </div>

            {categoryImage && (
              <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-[#F5F4F0] shadow-sm">
                <img src={categoryImage} alt={category.name} className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-6 py-12 md:px-8 md:py-16">
          {designs.length > 0 ? (
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {designs.map((design) => (
                <ProductCard key={design.id} product={design} />
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-zinc-300 bg-white p-10 text-center">
              <h2 className="font-serif text-2xl text-[#2A2623]">No designs yet</h2>
              <p className="mt-3 text-sm text-zinc-600">
                This category is live, but there are no public designs assigned to it right now.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
