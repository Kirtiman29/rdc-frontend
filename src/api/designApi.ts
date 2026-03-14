import { userApi } from './apiClient';
import type { Design, Category, DesignsResponse, DesignFilters } from '../types/product';

/**
 * Helper: Safely extract array from Spring Boot Pageable response
 * Data is already unwrapped by apiClient interceptor.
 */
const extractArray = (data: any): Design[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.content || data.designs || [];
};

/**
 * ✅ Sync: Main Gallery Feed
 * Service: VITE_ADMIN_SERVICE_URL
 */
export const getDesigns = async (filters?: DesignFilters): Promise<DesignsResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    // Pagination
    if (filters.page !== undefined) params.append('page', String(filters.page));
    if (filters.size !== undefined) params.append('size', String(filters.size));
    
    // Business Logic Filters
    if (filters.categoryId !== undefined) {
  params.append('categoryId', String(filters.categoryId));
}
    if (filters.segment) params.append('segment', String(filters.segment));
    
    // ✅ FIXED: Changed .luxury to .luxury to match types/product.ts
    if (filters.luxury !== undefined) params.append('luxury', String(filters.luxury));
    
    if (filters.trending !== undefined) params.append('trending', String(filters.trending));
    if (filters.editorsPick !== undefined) params.append('editorsPick', String(filters.editorsPick));
    if (filters.specialOffer !== undefined) params.append('specialOffer', String(filters.specialOffer));
    
    // ✅ ADDED: newArrival flag check
    if (filters.newArrival !== undefined) params.append('newArrival', String(filters.newArrival));
    
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sort', filters.sortBy); // Spring Data usually expects 'sort'
  }

  // ✅ Interceptor handles .data
  return await userApi.get('/public/designs/feed', {
  params
});
};

export const getTrendingDesigns = async (limit: number = 10): Promise<Design[]> => {
  const data = await userApi.get(`/public/designs/feed?trending=true&size=${limit}`);
  return extractArray(data);
};

export const getNewArrivals = async (limit: number = 10): Promise<Design[]> => {
  const data = await userApi.get(`/public/designs/feed?newArrival=true&size=${limit}`);
  return extractArray(data);
};

export const getEditorsPick = async (limit: number = 10): Promise<Design[]> => {
  const data = await userApi.get(`/public/designs/feed?editorsPick=true&size=${limit}`);
  return extractArray(data);
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const data = await userApi.get('/categories/public'); 
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to sync storefront categories:", error);
    return [];
  }
};

export const getDesignById = async (id: string | number): Promise<Design> => {
  return await userApi.get(`/public/designs/${id}`);
};

export const getRelatedDesigns = async (designId: string | number, limit: number = 4): Promise<Design[]> => {
  const data = await userApi.get(`/public/designs/${designId}/related?limit=${limit}`);
  return extractArray(data);
};