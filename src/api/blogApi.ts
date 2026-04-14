import { publicApi } from './apiClient';

export interface PublicBlog {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category?: string;
  author?: string;
  image?: string;
  featured?: boolean;
  publishedAt?: string;
}

interface BlogApiResponse {
  id: number;
  slug?: string;
  title?: string;
  excerpt?: string;
  summary?: string;
  description?: string;
  content?: string;
  category?: string;
  categoryName?: string;
  author?: string;
  authorName?: string;
  coverImageUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  coverAssetUuid?: string;
  assetUuid?: string;
  featured?: boolean;
  publishedAt?: string;
  createdAt?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const unwrapResponse = (response: unknown): unknown => {
  if (!isRecord(response)) return response;

  const data = response.data;

  if (isRecord(data) && 'data' in data) {
    return data.data;
  }

  return data ?? response;
};

const extractBlogArray = (data: unknown): BlogApiResponse[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as BlogApiResponse[];
  if (!isRecord(data)) return [];

  if (Array.isArray(data.content)) {
    return data.content as BlogApiResponse[];
  }

  if (Array.isArray(data.blogs)) {
    return data.blogs as BlogApiResponse[];
  }

  return [];
};

const makeExcerpt = (blog: BlogApiResponse) => {
  const source = blog.excerpt || blog.summary || blog.description || blog.content || '';
  return source.replace(/<[^>]*>/g, '').slice(0, 180);
};

const mapBlog = (blog: BlogApiResponse): PublicBlog => ({
  id: blog.id,
  slug: blog.slug || String(blog.id),
  title: blog.title || 'Untitled Blog',
  excerpt: makeExcerpt(blog),
  content: blog.content,
  category: blog.categoryName || blog.category || 'Editorial',
  author: blog.authorName || blog.author || 'RDC Editorial',
  image: blog.coverImageUrl || blog.imageUrl || blog.thumbnailUrl || blog.coverAssetUuid || blog.assetUuid,
  featured: blog.featured,
  publishedAt: blog.publishedAt || blog.createdAt,
});

export const getPublishedBlogs = async (): Promise<PublicBlog[]> => {
  const response = await publicApi.get('/public/blogs');
  return extractBlogArray(unwrapResponse(response)).map(mapBlog);
};

export const getFeaturedBlogs = async (): Promise<PublicBlog[]> => {
  const response = await publicApi.get('/public/blogs/featured');
  return extractBlogArray(unwrapResponse(response)).map(mapBlog);
};

export const getPublishedBlogBySlug = async (slug: string): Promise<PublicBlog> => {
  const response = await publicApi.get(`/public/blogs/${slug}`);
  return mapBlog(unwrapResponse(response) as BlogApiResponse);
};
