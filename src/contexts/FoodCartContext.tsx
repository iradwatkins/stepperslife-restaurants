"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Id } from '@/convex/_generated/dataModel';

export interface FoodCartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface FoodCart {
  restaurantId: string | null;
  restaurantSlug: string | null;
  restaurantName: string | null;
  items: FoodCartItem[];
}

interface PendingCartSwitch {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  item: Omit<FoodCartItem, 'quantity'>;
}

interface FoodCartContextType {
  cart: FoodCart;
  addToCart: (restaurantId: string, restaurantSlug: string, restaurantName: string, item: Omit<FoodCartItem, 'quantity'>) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  reorderItems: (restaurantId: string, restaurantSlug: string, restaurantName: string, items: FoodCartItem[]) => void;
  // Cart switch confirmation
  pendingCartSwitch: PendingCartSwitch | null;
  confirmCartSwitch: () => void;
  cancelCartSwitch: () => void;
}

const MAX_QUANTITY = 99;
const STORAGE_KEY = 'food-cart';
const CART_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const emptyCart: FoodCart = {
  restaurantId: null,
  restaurantSlug: null,
  restaurantName: null,
  items: [],
};

const FoodCartContext = createContext<FoodCartContextType | undefined>(undefined);

export function FoodCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<FoodCart>(emptyCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingCartSwitch, setPendingCartSwitch] = useState<PendingCartSwitch | null>(null);

  // Load cart from localStorage on mount (persists across browser sessions)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const { cart: savedCart, timestamp } = JSON.parse(savedData);
          // Check if cart has expired (24 hours)
          if (Date.now() - timestamp < CART_EXPIRY_MS) {
            setCart(savedCart);
          } else {
            // Cart expired, remove it
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (error) {
          console.error('Failed to load food cart:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes (persists across browser sessions)
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      if (cart.items.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        // Save with timestamp for expiry checking
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          cart,
          timestamp: Date.now(),
        }));
      }
    }
  }, [cart, isLoaded]);

  const addToCart = useCallback((
    restaurantId: string,
    restaurantSlug: string,
    restaurantName: string,
    item: Omit<FoodCartItem, 'quantity'>
  ) => {
    setCart(currentCart => {
      // If cart has items from a different restaurant, show confirmation dialog
      if (currentCart.restaurantId && currentCart.restaurantId !== restaurantId && currentCart.items.length > 0) {
        // Store pending switch instead of immediately clearing
        setPendingCartSwitch({ restaurantId, restaurantSlug, restaurantName, item });
        return currentCart; // Don't modify cart yet
      }

      // Check if item already exists
      const existingIndex = currentCart.items.findIndex(i => i.menuItemId === item.menuItemId);

      if (existingIndex > -1) {
        // Check quantity limit
        if (currentCart.items[existingIndex].quantity >= MAX_QUANTITY) {
          return currentCart;
        }
        // Update quantity
        const newItems = [...currentCart.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + 1,
        };
        return {
          ...currentCart,
          restaurantId,
          restaurantSlug,
          restaurantName,
          items: newItems,
        };
      }

      // Add new item
      return {
        restaurantId,
        restaurantSlug,
        restaurantName,
        items: [...currentCart.items, { ...item, quantity: 1 }],
      };
    });
    setIsCartOpen(true);
  }, []);

  // Confirm switching to a new restaurant (clears current cart)
  const confirmCartSwitch = useCallback(() => {
    if (pendingCartSwitch) {
      setCart({
        restaurantId: pendingCartSwitch.restaurantId,
        restaurantSlug: pendingCartSwitch.restaurantSlug,
        restaurantName: pendingCartSwitch.restaurantName,
        items: [{ ...pendingCartSwitch.item, quantity: 1 }],
      });
      setPendingCartSwitch(null);
      setIsCartOpen(true);
    }
  }, [pendingCartSwitch]);

  // Cancel switching restaurants (keep current cart)
  const cancelCartSwitch = useCallback(() => {
    setPendingCartSwitch(null);
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(currentCart => {
      const existingIndex = currentCart.items.findIndex(i => i.menuItemId === menuItemId);
      if (existingIndex === -1) return currentCart;

      const existing = currentCart.items[existingIndex];
      if (existing.quantity > 1) {
        // Decrease quantity
        const newItems = [...currentCart.items];
        newItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity - 1,
        };
        return { ...currentCart, items: newItems };
      }

      // Remove item completely
      const newItems = currentCart.items.filter(i => i.menuItemId !== menuItemId);
      if (newItems.length === 0) {
        return emptyCart;
      }
      return { ...currentCart, items: newItems };
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(currentCart => {
        const newItems = currentCart.items.filter(i => i.menuItemId !== menuItemId);
        if (newItems.length === 0) {
          return emptyCart;
        }
        return { ...currentCart, items: newItems };
      });
      return;
    }

    if (quantity > MAX_QUANTITY) {
      quantity = MAX_QUANTITY;
    }

    setCart(currentCart => ({
      ...currentCart,
      items: currentCart.items.map(item =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      ),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart(emptyCart);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const reorderItems = useCallback((
    restaurantId: string,
    restaurantSlug: string,
    restaurantName: string,
    items: FoodCartItem[]
  ) => {
    // Replace entire cart with the reorder items
    setCart({
      restaurantId,
      restaurantSlug,
      restaurantName,
      items: items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
      })),
    });
    setIsCartOpen(true);
  }, []);

  const getItemCount = useCallback(() => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart.items]);

  const getSubtotal = useCallback(() => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart.items]);

  return (
    <FoodCartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
        isCartOpen,
        setIsCartOpen,
        reorderItems,
        pendingCartSwitch,
        confirmCartSwitch,
        cancelCartSwitch,
      }}
    >
      {children}
    </FoodCartContext.Provider>
  );
}

export function useFoodCart() {
  const context = useContext(FoodCartContext);
  if (context === undefined) {
    throw new Error('useFoodCart must be used within a FoodCartProvider');
  }
  return context;
}
