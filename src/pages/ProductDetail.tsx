import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ChevronRight,
  Hash,
  Heart,
  Loader2,
  PlayCircle,
  Share2,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { addToCart } from '@/api/cartApi';
import {
  getDesignBySlugOrId,
  getDesigns,
  requestSubscriptionDesignDownload,
} from '@/api/designApi';
import { getAssetUrl, getToken } from '@/api/apiClient';
import {
  getMySubscription,
  getRemainingDesigns,
  type UserSubscriptionSummary,
} from '@/api/subscriptionApi';
import {
  addToWishlist,
  checkWishlistStatus,
  removeFromWishlist,
} from '@/api/wishlistApi';
import { useToast } from '@/hooks/use-toast';
import { useCanonicalLink } from '@/hooks/useCanonicalLink';
import type { Design } from '@/types/product';
import { getProductPath } from '@/utils/routes';
import { formatPrice } from '@/utils/price';

type ApiErrorLike = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
};

type PageErrorState = {
  title: string;
  description: string;
  requiresSubscription?: boolean;
};

type DownloadRequestState = 'idle' | 'submitted' | 'already-requested';

const getApiMessage = (error: unknown, fallback: string) => {
  const data = (error as ApiErrorLike)?.response?.data;
  return data?.message || data?.error || fallback;
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<Design | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<PageErrorState | null>(null);
  const [isWished, setIsWished] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRequestingDownload, setIsRequestingDownload] = useState(false);
  const [remainingDesigns, setRemainingDesigns] = useState<number | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloadRequestState, setDownloadRequestState] = useState<DownloadRequestState>('idle');
  const [activeMediaUrl, setActiveMediaUrl] = useState('');
  const [activeMediaType, setActiveMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  const canonicalPath = product ? getProductPath(product) : undefined;
  const canonicalUrl =
    canonicalPath && typeof window !== 'undefined' ? `${window.location.origin}${canonicalPath}` : undefined;

  useCanonicalLink(canonicalUrl);

  const handleContextMenu = (event: React.MouseEvent) => event.preventDefault();

  useEffect(() => {
    const fetchFullData = async () => {
      if (!slug) return;

      setLoading(true);
      setPageError(null);
      setProduct(null);
      setRelatedProducts([]);
      setDownloadStatus(null);
      setDownloadRequestState('idle');

      try {
        const designData = await getDesignBySlugOrId(slug);
        setProduct(designData);

        if (designData.slug && slug !== designData.slug) {
          navigate(getProductPath(designData), { replace: true });
        }

        const cover = designData.media?.find((media) => media.role === 'COVER');
        setActiveMediaUrl(cover ? getAssetUrl(cover.url) : getAssetUrl(designData.assetUuid));
        setActiveMediaType('IMAGE');

        try {
          const primarySegment = designData.segments?.[0] || designData.segment;
          if (primarySegment) {
            const response = await getDesigns({
              segment: primarySegment,
              size: 10,
            });

            const content = (Array.isArray(response) ? response : response?.content || [])
              .filter((item: Design) => item.id !== designData.id)
              .sort((first: Design, second: Design) => second.id - first.id)
              .slice(0, 4);

            setRelatedProducts(content);
          }
        } catch (relatedError) {
          console.error('Related sync failed:', relatedError);
        }

        try {
          const wished = await checkWishlistStatus(designData.id);
          setIsWished(wished);
        } catch (wishlistError) {
          console.warn('Wishlist sync unavailable:', wishlistError);
          setIsWished(false);
        }

        if (designData.subscriptionOnly && getToken()) {
          try {
            const subscription: UserSubscriptionSummary = await getMySubscription();
            setRemainingDesigns(getRemainingDesigns(subscription));
          } catch (subscriptionError) {
            console.warn('Subscription summary unavailable:', subscriptionError);
            setRemainingDesigns(null);
          }
        } else {
          setRemainingDesigns(null);
        }
      } catch (error) {
        console.error('Sync failed:', error);

        const status = (error as ApiErrorLike)?.response?.status;
        const message = getApiMessage(error, 'We could not load this design right now.');

        if (status === 403 && message === 'Active design subscription required') {
          setPageError({
            title: 'Subscription access required',
            description: 'This design is available only with an active design or combo subscription.',
            requiresSubscription: true,
          });
        } else if (status === 404) {
          setPageError({
            title: 'Design not found',
            description: 'This design is no longer available in the public collection.',
          });
        } else {
          setPageError({
            title: 'Design unavailable',
            description: message,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchFullData();
  }, [navigate, slug]);

  const goToLogin = (design: Pick<Design, 'id' | 'slug'>) => {
    navigate('/login', { state: { from: getProductPath(design) } });
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAdding(true);

    try {
      await addToCart(product.id, 1);
      toast({
        title: 'Added to Bag',
        description: `${product.title} is ready for checkout.`,
      });
    } catch (error) {
      const status = (error as ApiErrorLike)?.response?.status;
      const message = getApiMessage(error, '');

      if (message.toLowerCase().includes('already')) {
        toast({
          title: 'Already in Cart',
          description: 'This design is already in your cart.',
          variant: 'destructive',
        });
        return;
      }

      if (status === 401) {
        goToLogin(product);
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Unable to add to cart',
        description: getApiMessage(error, 'Please try again in a moment.'),
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    try {
      if (isWished) {
        await removeFromWishlist(product.id);
        setIsWished(false);
      } else {
        await addToWishlist(product.id);
        setIsWished(true);
      }

      toast({ title: isWished ? 'Removed from Selection' : 'Saved to Archive' });
    } catch (error) {
      if ((error as ApiErrorLike)?.response?.status === 401) {
        goToLogin(product);
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Wishlist unavailable',
        description: getApiMessage(error, 'Please try again in a moment.'),
      });
    }
  };

  const handleRequestSubscriptionDownload = async () => {
    if (!product) return;

    setIsRequestingDownload(true);

    try {
      const response = await requestSubscriptionDesignDownload(product.id);

      setRemainingDesigns(response.remainingDesigns);
      setDownloadStatus(response.status);

      if (response.alreadyRequested) {
        setDownloadRequestState('already-requested');
        toast({
          title: 'Request already exists',
          description: 'TIFF will be shared manually.',
        });
      } else {
        setDownloadRequestState('submitted');
        toast({
          title: 'Design request submitted',
          description: response.message || 'TIFF will be shared manually.',
        });
      }
    } catch (error) {
      const status = (error as ApiErrorLike)?.response?.status;

      if (status === 401) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to request this design.',
        });
        goToLogin(product);
        return;
      }

      if (status === 409) {
        setRemainingDesigns(0);
      }

      const fallbackMessage =
        status === 400
          ? 'This design is not available for subscription download.'
          : status === 403
            ? 'An active design subscription is required.'
            : status === 409
              ? 'Your design quota is exhausted.'
              : 'Unable to request this design.';

      toast({
        variant: 'destructive',
        title: 'Request failed',
        description: getApiMessage(error, fallbackMessage),
      });
    } finally {
      setIsRequestingDownload(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white font-sans">
        <div className="h-[600px] w-[500px] animate-pulse bg-slate-100" />
      </div>
    );
  }

  if (pageError || !product) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-white font-sans">
        <Header />
        <main className="flex flex-1 items-center justify-center px-6 py-20">
          <div className="w-full max-w-xl rounded-sm border border-zinc-200 bg-zinc-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm">
              <AlertCircle size={22} />
            </div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">
              {pageError?.title || 'Design unavailable'}
            </h1>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              {pageError?.description || 'We could not load this design right now.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {pageError?.requiresSubscription && (
                <Button
                  className="h-12 rounded-sm bg-[#2A2623] px-6 text-[10px] font-bold uppercase tracking-[0.24em] hover:bg-black"
                  onClick={() =>
                    navigate(getToken() ? '/subscription' : '/login', {
                      state: !getToken() && slug ? { from: getProductPath(product) } : undefined,
                    })
                  }
                >
                  {getToken() ? 'Get Subscription' : 'Login To Continue'}
                </Button>
              )}
              <Button
                variant="outline"
                className="h-12 rounded-sm px-6 text-[10px] font-bold uppercase tracking-[0.24em]"
                onClick={() => navigate('/gallery')}
              >
                Back to Gallery
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isSubscriptionDesign = Boolean(product.subscriptionOnly);
  const productPrice = product.specialOffer
    ? product.basePriceCents * (1 - product.discountPercent / 100)
    : product.basePriceCents;
  const isQuotaExhausted = isSubscriptionDesign && remainingDesigns !== null && remainingDesigns <= 0;
  const isRequestLocked = downloadRequestState !== 'idle';
  const subscriptionAccessText =
    remainingDesigns === null
      ? 'Included with an active design or combo subscription.'
      : `${remainingDesigns} subscription design requests left.`;
  const downloadButtonLabel = isRequestingDownload
    ? 'Submitting...'
    : downloadRequestState === 'already-requested'
      ? 'Already Requested'
      : downloadRequestState === 'submitted'
        ? 'Request Submitted'
        : isQuotaExhausted
          ? 'Quota Exhausted'
          : 'Request TIFF Download';

  const shareCurrentPage = async () => {
    const shareUrl = canonicalUrl || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title || document.title,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed', error);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied', description: 'Product link copied to your clipboard.' });
    } catch (error) {
      console.log('Clipboard copy failed', error);
      toast({
        variant: 'destructive',
        title: 'Share unavailable',
        description: 'We could not copy the product link right now.',
      });
    }
  };

  return (
    <div
      className="flex min-h-screen w-full flex-col bg-white font-sans selection:bg-slate-100"
      onContextMenu={handleContextMenu}
    >
      <Header />
      <main className="flex-1 w-full">
        <div className="border-b border-slate-50 bg-white">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-4">
            <nav className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
              <Link to="/" className="transition-colors hover:text-[#2A2623]">
                Archive
              </Link>
              <ChevronRight size={8} strokeWidth={4} className="text-slate-200" />
              <Link to="/gallery" className="transition-colors hover:text-[#2A2623]">
                Collections
              </Link>
              <ChevronRight size={8} strokeWidth={4} className="text-slate-200" />
              <span className="text-[#2A2623]">{product.title}</span>
            </nav>
          </div>
        </div>

        <section className="py-12 lg:py-20">
          <div className="mx-auto w-full max-w-[1200px] px-6">
            <div className="flex w-full flex-col items-start gap-16 lg:flex-row">
              <div className="flex w-full flex-col gap-6 lg:w-3/5">
                <div className="relative flex max-h-[800px] w-full items-center justify-center overflow-hidden rounded-sm border border-slate-100 bg-[#F9F9F9] shadow-sm">
                  <div
                    className="absolute inset-0 z-10 pointer-events-none opacity-20"
                    style={{
                      backgroundImage:
                        'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctext x=\'50%25\' y=\'50%25\' font-family=\'sans-serif\' font-size=\'36\' fill=\'black\' text-anchor=\'middle\' transform=\'rotate(-30 100 100)\'%3ERDC%3C/text%3E%3C/svg%3E")',
                      backgroundRepeat: 'repeat',
                    }}
                  />
                  <div className="absolute inset-0 z-20" onContextMenu={handleContextMenu} />

                  {activeMediaType === 'VIDEO' ? (
                    <video
                      src={activeMediaUrl}
                      controls
                      loop
                      autoPlay
                      muted
                      playsInline
                      className="w-full max-h-[800px] object-contain"
                    />
                  ) : (
                    <img
                      src={activeMediaUrl}
                      alt={product.title}
                      className="w-full max-h-[800px] object-contain"
                    />
                  )}
                </div>

                {product.media && product.media.length > 1 && (
                  <div className="scrollbar-hide flex flex-row gap-4 overflow-x-auto pb-2">
                    {product.media.map((media, index) => (
                      <button
                        key={`${media.url}-${index}`}
                        onClick={() => {
                          setActiveMediaUrl(getAssetUrl(media.url));
                          setActiveMediaType(media.type === 'VIDEO' ? 'VIDEO' : 'IMAGE');
                        }}
                        className={`relative h-24 w-24 rounded-sm border transition-all duration-500 ${
                          activeMediaUrl === getAssetUrl(media.url)
                            ? 'border-zinc-900 shadow-lg'
                            : 'border-slate-100 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {media.type === 'VIDEO' ? (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                            <PlayCircle className="h-6 w-6 stroke-1 text-white" />
                          </div>
                        ) : (
                          <img
                            src={getAssetUrl(media.url)}
                            className="h-full w-full object-cover"
                            alt="Thumbnail"
                            draggable={false}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {product.description && (
                  <div className="mt-10 border-t border-zinc-200 pt-8">
                    <h3 className="mb-6 text-[11px] font-bold uppercase tracking-[0.3em] text-black">
                      Product Description
                    </h3>
                    <div className="max-w-2xl text-[15px] leading-relaxed text-zinc-700">
                      <div className="space-y-4 font-light">
                        <ul className="space-y-2">
                          {product.description
                            .split('\n')
                            .filter((line) => line.trim() !== '')
                            .map((line, index) => (
                              <li key={index} className="flex items-start gap-2 text-[14px]">
                                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                                <span>{line}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col pt-4 lg:sticky lg:top-24 lg:w-2/5">
                <div className="mb-8 flex items-center gap-3">
                  {product.luxury && (
                    <span className="flex items-center gap-1.5 rounded-sm bg-zinc-900 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                      <ShieldCheck size={10} /> Luxury Exclusive
                    </span>
                  )}
                  {isSubscriptionDesign && (
                    <span className="rounded-sm bg-[#BA1B1C] px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                      Subscription Access
                    </span>
                  )}
                </div>

                <h1 className="mb-6 text-4xl font-semibold leading-tight tracking-tight text-[#1A1A1A] lg:text-6xl">
                  {product.title}
                </h1>

                {product.segments && product.segments.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {product.segments.map((segment, index) => (
                      <span
                        key={`${segment}-${index}`}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-700"
                      >
                        {segment.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mb-8 flex w-fit items-center gap-2 rounded-sm border border-zinc-100 bg-zinc-50 px-4 py-2">
                  <Hash size={10} className="text-zinc-400" />
                  <span className="mr-1 border-r border-zinc-200 pr-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    Design ID
                  </span>
                  <span className="text-xs font-bold text-[#1A1A1A]">
                    {product.designIdentifier || `RDC-${product.id}`}
                  </span>
                </div>

                <div className="mb-10 flex items-center gap-4 border-b border-zinc-100 pb-6">
                  <div className="flex flex-col">
                    <span className="text-4xl font-light text-[#1A1A1A]">
                      {isSubscriptionDesign ? 'Included in subscription' : formatPrice(productPrice)}
                    </span>
                    {isSubscriptionDesign ? (
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#BA1B1C]">
                        {subscriptionAccessText}
                      </span>
                    ) : (
                      product.discountPercent > 0 && (
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-red-500">
                          {product.discountPercent}% OFF
                        </span>
                      )
                    )}
                  </div>
                  {!isSubscriptionDesign && product.discountPercent > 0 && (
                    <span className="mt-2 self-start text-xl font-light text-zinc-300 line-through">
                      {formatPrice(product.basePriceCents)}
                    </span>
                  )}
                </div>

                {product.categories && product.categories.length > 0 && (
                  <div className="mb-10">
                    <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
                      Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.categories.map((category) => (
                        <span
                          key={category.id}
                          className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-semibold text-zinc-700"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.tags && product.tags.length > 0 && (
                  <div className="mb-12">
                    <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] text-zinc-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className="mb-12 space-y-6 rounded-sm border border-zinc-100 bg-zinc-50/50 p-8"
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                >
                  <h4 className="border-b border-zinc-200 pb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">
                    Master File Specs
                  </h4>

                  <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3">
                    <SpecItem label="Master Format" value={product.imageFormat || 'Industrial TIFF'} />
                    <SpecItem
                      label="DPI Resolution"
                      value={product.resolution ? `${product.resolution} DPI` : '300+ Print Ready'}
                    />
                    <SpecItem
                      label="Seamless"
                      value={product.repeatSize ? product.repeatSize.replace('x', ' x ') : 'Seamless Repeat'}
                    />
                    <SpecItem label="Color Count" value={String(product.colorCount || 'N/A')} />
                    <SpecItem label="Image Type" value={product.imageType || 'N/A'} />
                    <SpecItem label="Design Type" value={product.designType || 'Digital'} />
                    <SpecItem
                      label="File Type"
                      value={product.media?.find((media) => media.role === 'DOWNLOAD')?.type || 'TIFF'}
                    />
                    <SpecItem
                      label="Licensing"
                      value={product.luxury ? 'Full Exclusive' : 'Commercial Standard'}
                    />
                  </div>

                  <div className="flex gap-3 border-t border-zinc-200 pt-6">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-zinc-500" />
                    <div className="space-y-3">
                      <p className="text-[11px] leading-relaxed text-zinc-600">
                        <span className="mr-1 font-bold uppercase tracking-tighter text-zinc-900">
                          Refund Policy:
                        </span>
                        Digital assets are non-refundable once the high-resolution master file download link has
                        been generated or delivered.
                      </p>
                      <p className="text-[11px] leading-relaxed text-zinc-600">
                        <span className="mr-1 font-bold uppercase tracking-tighter text-zinc-900">
                          Color Accuracy:
                        </span>
                        Color appearance may vary depending on screen settings and hardware calibration. For the
                        most accurate color evaluation, we recommend viewing the design on a professionally
                        calibrated monitor.
                      </p>
                      <p className="text-[11px] leading-relaxed text-zinc-600">
                        <span className="mr-1 font-bold uppercase tracking-tighter text-zinc-900">
                          Exclusivity:
                        </span>
                        Upon successful acquisition, this design will be permanently removed from our public
                        catalog and will not be resold or redistributed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {isSubscriptionDesign ? (
                    <>
                      <Button
                        size="lg"
                        className="h-16 w-full rounded-sm bg-[#2A2623] text-[11px] font-bold uppercase tracking-[0.3em] text-white shadow-lg transition-all active:scale-[0.98] hover:bg-black"
                        onClick={handleRequestSubscriptionDownload}
                        disabled={isRequestingDownload || isRequestLocked || isQuotaExhausted}
                      >
                        {isRequestingDownload ? (
                          <Loader2 className="mr-2 animate-spin" />
                        ) : (
                          <ShoppingBag className="mr-3" size={14} />
                        )}
                        {downloadButtonLabel}
                      </Button>

                      <div className="rounded-sm border border-[#E7D1CC] bg-[#FFF7F4] px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#BA1B1C]">
                          Manual delivery
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-700">
                          {isQuotaExhausted
                            ? 'Your design quota is exhausted. Renew or upgrade your subscription to request more TIFF files.'
                            : downloadRequestState === 'already-requested'
                              ? 'This design was already requested. TIFF will still be shared manually by the admin team.'
                              : downloadStatus === 'PENDING'
                                ? 'Your request is pending. TIFF will be shared manually by the admin team.'
                                : 'Submitting this request records the download against your subscription. TIFF will be shared manually later.'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <Button
                      size="lg"
                      className="h-16 w-full rounded-sm bg-[#2A2623] text-[11px] font-bold uppercase tracking-[0.3em] text-white shadow-lg transition-all active:scale-[0.98] hover:bg-black"
                      onClick={handleAddToCart}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <Loader2 className="mr-2 animate-spin" />
                      ) : (
                        <ShoppingBag className="mr-3" size={14} />
                      )}
                      Add to Cart
                    </Button>
                  )}

                  <button
                    onClick={handleToggleWishlist}
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-sm border border-zinc-200 text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A] transition-colors hover:bg-zinc-50"
                  >
                    <Heart
                      className={isWished ? 'fill-rose-500 stroke-rose-500' : 'stroke-zinc-900'}
                      size={14}
                    />
                    {isWished ? 'Saved to Archive' : 'Add to Wishlist'}
                  </button>

                  <button
                    onClick={shareCurrentPage}
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-sm border border-zinc-200 text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A] transition-colors hover:bg-zinc-50"
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="border-t border-zinc-100 bg-[#FAFAFA] py-24">
            <div className="mx-auto w-full max-w-[1200px] px-6">
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">
                    Segment Alignment
                  </span>
                  <h3 className="mt-2 text-3xl font-semibold text-[#1A1A1A]">Related Patterns</h3>
                </div>
                <Link
                  to="/gallery"
                  className="border-b border-zinc-900 pb-1 text-[10px] font-bold uppercase tracking-widest transition-opacity hover:opacity-60"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {relatedProducts.map((design) => (
                  <ProductCard key={design.id} product={design} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

const SpecItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
    <span className="text-xs font-medium text-[#1A1A1A]">{value}</span>
  </div>
);

export default ProductDetail;
