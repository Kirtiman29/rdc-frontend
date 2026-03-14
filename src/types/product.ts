// src/types/product.ts

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

/**
 * Matches Admin Service MediaDTO
 */
export interface DesignMedia {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'TIFF';
  role: 'COVER' | 'GALLERY' | 'PREVIEW_VIDEO' | 'DOWNLOAD';
}

/**
 * ✅ UPDATED: Industrial Design Entity with Specifications
 * This matches your backend schema for Textile/Graphic Design Marketplace
 */
export interface Design {
  id: number;
  title: string;
  description: string;
  slug: string;
  designIdentifier: string; // The Alphanumeric SKU (e.g., AG-WOMEN-001)
  assetUuid: string; 
  basePriceCents: number;
  finalPriceCents: number;
  discountPercent: number;
  specialOffer: boolean;
  
  // High-level Flags
  luxury: boolean;
  newArrival: boolean;
  trending: boolean;
  editorsPick: boolean;
  active: boolean;
  draft: boolean;
  
  // Classification
  // Classification
segment?: 'MENSWEAR' | 'WOMENSWEAR' | 'KIDSWEAR' | 'HOME_INTERIOR' | 'ACCESSORIES';
segments?: (
  | 'MENSWEAR'
  | 'WOMENSWEAR'
  | 'KIDSWEAR'
  | 'HOME_INTERIOR'
  | 'ACCESSORIES'
)[];
  
  // Industrial Specifications
  imageFormat?: string;   // e.g. TIFF, PSD, PNG
  imageType?: string;     // e.g. VECTOR, BITMAP
  repeatSize?: string;    // e.g. 64x64
  colorCount?: number;    // e.g. 12
  resolution?: string;    // e.g. 300 DPI
  designType?: string;    // e.g. DIGITAL, ROTARY

  // Relationships & Collections
  categories?: Category[]; // Multi-category support
  category?: Category;     // Legacy single category support
  tags: string[];
  media: DesignMedia[]; 
  
  createdAt: string;
  updatedAt?: string;
}

/**
 * Matches Order Service OrderResponse 
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
 * Order Item Snapshot
 */
export interface OrderItemResponse {
  id: number;
  designId: number;
  designIdentifier: string; 
  assetUuid: string;
  designTitle: string;
  quantity: number;
  priceCents: number;
  totalPriceCents: number;
}

/**
 * Standardized Filters for Spring Boot Pageable
 * Used for catalog searching and gallery filtering
 */
export interface DesignFilters {
  // Spring Boot Pagination Parameters
  page?: number;  // The zero-based page index
  size?: number;  // The size of the page (Replaces 'limit')
  
  // Business Logic Filters
  categoryId?: number;
  segment?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  luxury?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  editorsPick?: boolean;
  specialOffer?: boolean;
  search?: string;
  sortBy?: string;
}

/**
 * Full Spring Data Page Wrapper
 * Use this when fetching designs from the API
 */
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