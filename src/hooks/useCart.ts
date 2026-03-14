// src/components/hooks/useCart.ts
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const isInitialMount = useRef(true);

  const fetchCart = useCallback(async () => {
    const token = getToken();
    if (!token) {
      // If no token, reset state and stop to prevent infinite loops
      setItems([]);
      setTotalCount(0);
      return;
    }

    try {
      const summary = await getCart();
      // Only update if data actually changed to prevent render cycles
      setItems(prev => JSON.stringify(prev) === JSON.stringify(summary.items) ? prev : summary.items);
      setTotalCount(summary.totalItems);
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      fetchCart();
      isInitialMount.current = false;
    }
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
      await apiAddToCart(product.id, 1);
      await fetchCart();
      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add item to cart.",
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