import { publicApi } from './apiClient'; 
import type { Design, Category, DesignsResponse, DesignFilters } from '../types/product';

/**
 * Helper: Safely extract array from Spring Boot Pageable response
 */
const extractArray = (data: any): Design[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.content || data.designs || [];
};

/**
 * ✅ Sync: Main Gallery Feed
 * Path: /api/public/designs/feed
 */
export const getDesigns = async (filters?: DesignFilters): Promise<DesignsResponse> => {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.page !== undefined) params.append('page', String(filters.page));
    if (filters.limit !== undefined) params.append('size', String(filters.limit)); 
    if (filters.category) params.append('category', String(filters.category));
    if (filters.segment) params.append('segment', filters.segment);
    if (filters.premium !== undefined) params.append('premium', String(filters.premium));
    if (filters.trending !== undefined) params.append('trending', String(filters.trending));
    if (filters.editorsPick !== undefined) params.append('editorsPick', String(filters.editorsPick));
    if (filters.specialOffer !== undefined) params.append('specialOffer', String(filters.specialOffer));
    if (filters.search) params.append('search', filters.search);
  }

  const response = await publicApi.get<DesignsResponse>(`/public/designs/feed?${params.toString()}`);
  return response.data;
};

/**
 * ✅ Trending Feed
 */
export const getTrendingDesigns = async (limit: number = 10): Promise<Design[]> => {
  const response = await publicApi.get(`/public/designs/feed?trending=true&size=${limit}`);
  return extractArray(response.data);
};

/**
 * ✅ New Arrivals Feed
 */
export const getNewArrivals = async (limit: number = 10): Promise<Design[]> => {
  const response = await publicApi.get(`/public/designs/feed?newArrival=true&size=${limit}`);
  return extractArray(response.data);
};

/**
 * ✅ Editors Choice
 */
export const getEditorsPick = async (limit: number = 10): Promise<Design[]> => {
  const response = await publicApi.get(`/public/designs/feed?editorsPick=true&size=${limit}`);
  return extractArray(response.data);
};

/**
 * ✅ FIXED: Category Sync 
 * Explicit Path: /api/categories/public
 * matches SecurityConfig: .requestMatchers("/api/categories/public").permitAll()
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await publicApi.get('/categories/public'); 
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Failed to sync storefront categories:", error);
    return [];
  }
};

/**
 * ✅ Public design detail
 */
export const getDesignById = async (id: string | number): Promise<Design> => {
  const response = await publicApi.get<Design>(`/public/designs/${id}`);
  return response.data;
};

/**
 * ✅ Related Designs Sync
 */
export const getRelatedDesigns = async (designId: string | number, limit: number = 4): Promise<Design[]> => {
  const response = await publicApi.get(`/public/designs/${designId}/related?limit=${limit}`);
  return extractArray(response.data);
};