// src/components/hooks/useCart.ts
// ✅ FIXED: Transitioned from in-memory to Port 8091 Persistence

import { useState, useEffect, useCallback } from 'react';
import { 
  getCart, 
  addToCart as apiAddToCart, 
  removeCartItem as apiRemoveItem, 
  clearCart as apiClearCart,
  CartItem as ApiCartItem 
} from '@/api/cartApi';
import { getToken } from '@/api/apiClient';
import { toast } from '@/hooks/use-toast';
import { Design } from '@/types/product';

export const useCart = () => {
  const [items, setItems] = useState<ApiCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Fetch cart data from Port 8091
  const fetchCart = useCallback(async () => {
    if (!getToken()) return;
    try {
      const summary = await getCart();
      setItems(summary.items);
      setTotalCount(summary.totalItems);
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (product: Design) => {
    if (!getToken()) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please login to add designs to your cart.",
      });
      return;
    }

    setLoading(true);
    try {
      // ✅ Persist to Cart DB (Port 8091)
      await apiAddToCart(product.id, 1);
      await fetchCart(); // Refresh local state
      
      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add item to cart. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const removeFromCart = useCallback(async (itemId: number) => {
    try {
      await apiRemoveItem(itemId);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await apiClearCart();
      setItems([]);
      setTotalCount(0);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  }, []);

  return {
    addToCart,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart,
    items,
    itemCount: totalCount,
    loading,
  };
};