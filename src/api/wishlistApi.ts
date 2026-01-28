// src/api/wishlistApi.ts
import { wishlistApi } from './apiClient'; 

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * ✅ FIXED: Industrial DTO naming
 * Matches the backend WishlistResponse.java
 */
export interface WishlistItem {
  id: number;           // Unique Wishlist Entry ID
  designId: number;     // ID for the Textile Design
  title: string;        // Design Name
  assetUuid: string;    // Reference for Port 8090 Media
  finalPriceCents: number; // Current Price in Paise
  slug: string;
}

// ==========================================
// API FUNCTIONS
// ==========================================

/**
 * Fetch the user's wishlist from Port 8093
 */
export const getWishlist = async (): Promise<WishlistItem[]> => {
  const response = await wishlistApi.get<WishlistItem[]>('');
  return response.data;
};

/**
 * Add a design to the wishlist
 */
export const addToWishlist = async (designId: number): Promise<void> => {
  await wishlistApi.post('', { designId });
};

/**
 * Remove an item from the wishlist
 */
export const removeFromWishlist = async (designId: number): Promise<void> => {
  await wishlistApi.delete(`/${designId}`);
};

/**
 * Check if a specific design is in the user's wishlist
 */
export const checkWishlistStatus = async (designId: number): Promise<boolean> => {
  try {
    const response = await wishlistApi.get<{ exists: boolean }>(`/check/${designId}`);
    return response.data.exists;
  } catch (error) {
    const list = await getWishlist();
    return list.some(item => item.designId === designId);
  }
};

export default wishlistApi;