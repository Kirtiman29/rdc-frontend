// src/api/cartApi.ts
import { cartApi } from './apiClient';

// ==========================================
// TYPE DEFINITIONS
// ==========================================
export interface CartItem {
  id: number;           // Primary Key in Cart DB
  designId: number;     // Design ID from Admin Service
  assetUuid: string;    // Used for Port 8090 Media
  designTitle: string;  
  quantity: number;     
  priceCents: number;   // Unit price (Snapshot from Admin Service)
  totalPriceCents: number; // Logic: quantity * priceCents
}

/**
 * Industrial wrapper for the frontend state
 */
export interface CartSummary {
  items: CartItem[];
  subtotalCents: number;
  totalItems: number;
}

// ==========================================
// API FUNCTIONS
// ==========================================

/**
 * Fetch all items in the user's cart.
 * Base URL: VITE_CART_SERVICE_URL (e.g., http://localhost:8091/api/cart)
 */
export const getCartItems = async (): Promise<CartItem[]> => {
  // ✅ Data is already unwrapped by the interceptor in apiClient.ts
  return await cartApi.get('/items');
};

/**
 * ✅ Unified Cart Fetcher (Used by Header.tsx)
 * Aggregates items into a summary for easier UI rendering.
 */
export const getCart = async (): Promise<CartSummary> => {
  const items = await getCartItems();
  
  // Ensure items is an array before reducing to prevent crashes
  const safeItems = Array.isArray(items) ? items : [];
  
  const subtotalCents = safeItems.reduce((acc, item) => acc + (item.totalPriceCents || 0), 0);
  const totalItems = safeItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  
  return {
    items: safeItems,
    subtotalCents,
    totalItems
  };
};

/**
 * Add a design to the cart.
 */
export const addToCart = async (designId: number, quantity: number = 1): Promise<CartItem> => {
  return await cartApi.post('/items', { 
    designId, 
    quantity 
  });
};

/**
 * Update quantity of an existing item.
 */
export const updateCartQuantity = async (itemId: number, quantity: number): Promise<CartItem> => {
  return await cartApi.put(`/items/${itemId}`, { 
    quantity 
  });
};

/**
 * Remove an item from the cart.
 */
export const removeCartItem = async (itemId: number): Promise<void> => {
  await cartApi.delete(`/items/${itemId}`);
};

/**
 * Clear the entire cart.
 */
export const clearCart = async (): Promise<void> => {
  await cartApi.delete('/items');
};

/**
 * Get item count for navbar badges.
 */
export const getCartCount = async (): Promise<number> => {
    const data: any = await cartApi.get('/count');
    // Interceptor returns the JSON body directly. 
    // Handle both { count: 5 } or raw 5.
    return typeof data === 'number' ? data : (data?.count || 0);
};

export default cartApi;