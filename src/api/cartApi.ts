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
 * Backend: GET http://localhost:8091/api/cart/items
 */
export const getCartItems = async (): Promise<CartItem[]> => {
  const response = await cartApi.get('/items');
  return response.data; // Backend returns List<CartItemResponse>
};

/**
 * ✅ NEW: Unified Cart Fetcher (Used by Header.tsx)
 * Aggregates items into a summary for easier UI rendering.
 */
export const getCart = async (): Promise<CartSummary> => {
  const items = await getCartItems();
  const subtotalCents = items.reduce((acc, item) => acc + item.totalPriceCents, 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  
  return {
    items,
    subtotalCents,
    totalItems
  };
};

/**
 * Add a design to the cart.
 * Backend: POST http://localhost:8091/api/cart/items
 */
export const addToCart = async (designId: number, quantity: number = 1): Promise<CartItem> => {
  const response = await cartApi.post('/items', { 
    designId, 
    quantity 
  });
  return response.data;
};

/**
 * Update quantity of an existing item.
 * Backend expects: @RequestBody Map<String, Integer> body
 */
export const updateCartQuantity = async (itemId: number, quantity: number): Promise<CartItem> => {
  const response = await cartApi.put(`/items/${itemId}`, { 
    quantity 
  });
  return response.data;
};

/**
 * Remove an item from the cart.
 * Backend: DELETE http://localhost:8091/api/cart/items/{itemId}
 */
export const removeCartItem = async (itemId: number): Promise<void> => {
  await cartApi.delete(`/items/${itemId}`);
};

/**
 * Clear the entire cart (e.g., after successful checkout).
 */
export const clearCart = async (): Promise<void> => {
  await cartApi.delete('/items');
};

/**
 * Get item count for navbar badges.
 * Backend: GET http://localhost:8091/api/cart/count
 */
export const getCartCount = async (): Promise<number> => {
    const response = await cartApi.get('/count');
    // Ensure we handle both raw numbers or { count: x } objects depending on API version
    return typeof response.data === 'number' ? response.data : response.data.count;
};

export default cartApi;