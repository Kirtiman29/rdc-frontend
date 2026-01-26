import { useState, useCallback } from 'react';
import { Product } from '@/types/product';
import { toast } from '@/hooks/use-toast';

export interface CartItem {
  product: Product;
  quantity: number;
}

// Simple in-memory cart state (will be replaced with context/backend later)
let cartItems: CartItem[] = [];
let listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const useCart = () => {
  const [, setUpdate] = useState(0);

  const subscribe = useCallback(() => {
    const listener = () => setUpdate(prev => prev + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  // Subscribe on mount
  useState(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  });

  const addToCart = useCallback((product: Product) => {
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      toast({
        title: "Already in cart",
        description: `${product.name} is already in your cart.`,
      });
      return;
    }

    cartItems = [...cartItems, { product, quantity: 1 }];
    notifyListeners();
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    cartItems = cartItems.filter(item => item.product.id !== productId);
    notifyListeners();
  }, []);

  const getCartItems = useCallback(() => cartItems, []);

  const getCartCount = useCallback(() => cartItems.length, []);

  const clearCart = useCallback(() => {
    cartItems = [];
    notifyListeners();
  }, []);

  return {
    addToCart,
    removeFromCart,
    getCartItems,
    getCartCount,
    clearCart,
    items: cartItems,
  };
};
