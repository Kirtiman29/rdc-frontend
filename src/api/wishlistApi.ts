import { wishlistApi } from './apiClient'; 

export interface WishlistItem {
  id: number;
  designId: number;
  title: string;
  assetUuid: string;
  finalPriceCents: number;
  slug: string;
}

/**
 * Fetch wishlist from VITE_WISHLIST_SERVICE_URL
 */
export const getWishlist = async (): Promise<WishlistItem[]> => {
  return await wishlistApi.get('');
};

export const addToWishlist = async (designId: number): Promise<void> => {
  await wishlistApi.post('', { designId });
};

export const removeFromWishlist = async (designId: number): Promise<void> => {
  await wishlistApi.delete(`/${designId}`);
};

export const checkWishlistStatus = async (designId: number): Promise<boolean> => {
  try {
    const data: any = await wishlistApi.get(`/check/${designId}`);
    // Interceptor already returned JSON body
    return data?.exists || false;
  } catch (error) {
    const list = await getWishlist();
    return Array.isArray(list) ? list.some(item => item.designId === designId) : false;
  }
};

export default wishlistApi;