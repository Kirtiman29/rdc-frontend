// src/types/product.ts

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

/**
 * Matches Admin Service MediaDTO [cite: 122, 415]
 */
export interface DesignMedia {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'TIFF';
  role: 'COVER' | 'GALLERY' | 'PREVIEW_VIDEO' | 'DOWNLOAD';
}

/**
 * ✅ FIXED: Industrial Design Entity [cite: 128-131, 179-188]
 */
export interface Design {
  id: number;
  title: string;
  description: string;
  slug: string;
  assetUuid: string; 
  basePriceCents: number;
  finalPriceCents: number;
  discountPercent: number;
  specialOffer: boolean;
  premium: boolean;
  newArrival: boolean;
  trending: boolean;
  editorsPick: boolean;
  active: boolean;
  draft: boolean;
  segment: 'MENSWEAR' | 'WOMENSWEAR' | 'KIDSWEAR' | 'HOME_INTERIOR';
  media: DesignMedia[]; 
  category?: Category;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * ✅ NEW: Matches Order Service OrderItemResponse [cite: 1008-1011]
 */
export interface OrderItemResponse {
  id: number;
  designId: number;
  assetUuid: string;
  designTitle: string;
  quantity: number;
  priceCents: number;
  totalPriceCents: number;
}

/**
 * ✅ NEW: Matches Order Service OrderResponse 
 */
export interface OrderResponse {
  id: number;
  userId: number;
  totalPriceCents: number; 
  status: 'CREATED' | 'PAID' | 'CANCELLED' | 'SHIPPED' | 'DELIVERED';
  createdAt: string;
  updatedAt: string;
  items?: OrderItemResponse[];
}

/**
 * Standardized Filters for Spring Boot Pageable [cite: 22, 123-127]
 */
export interface DesignFilters {
  page?: number;
  limit?: number; 
  category?: number | string;
  segment?: string;
  minPrice?: number;
  maxPrice?: number;
  premium?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  editorsPick?: boolean;
  specialOffer?: boolean;
  search?: string;
  sortBy?: string;
}

export interface DesignsResponse {
  content: Design[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Aliases for legacy UI components
export type Product = Design;
export type ProductFilter = DesignFilters;