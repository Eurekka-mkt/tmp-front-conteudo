import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Course } from '../types/course';
import type { Book } from '../types/content';
import type { Combo } from '../types/combo';

interface CartItem {
  course: Course | Book | Combo;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Course | Book | Combo; quantity?: number }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  addItem: (item: Course | Book | Combo, quantity?: number) => void;
  removeItem: (courseId: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        (item) => item.course.id === action.payload.id
      );

      if (existingItem) {
        // Update quantity if item already exists
        const newItems = state.items.map(item =>
          item.course.id === action.payload.id
            ? { ...item, quantity: item.quantity + (action.quantity || 1) }
            : item
        );
        const newTotal = calculateTotal(newItems);
        return { items: newItems, total: newTotal };
      }

      const newItems = [...state.items, { course: action.payload, quantity: action.quantity || 1 }];
      const newTotal = calculateTotal(newItems);

      return { items: newItems, total: newTotal };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.course.id === action.payload.id
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      );
      const newTotal = calculateTotal(newItems);
      return { items: newItems, total: newTotal };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(
        (item) => item.course.id !== action.payload
      );
      const newTotal = calculateTotal(newItems);

      return { items: newItems, total: newTotal };
    }

    case 'CLEAR_CART':
      return { items: [], total: 0 };

    default:
      return state;
  }
};

const calculateTotal = (items: CartItem[]): number => {
  // Soma dos produtos
  const productsTotal = items.reduce((sum, item) => {
    const itemPrice = item.course.price || 0;
    return sum + itemPrice * item.quantity;
  }, 0);

  // Maior valor de frete
  const maxShipping = items.reduce((max, item) => {
    if ('physical' in item.course && item.course.physical && item.course.shippingPrice) {
      return Math.max(max, item.course.shippingPrice);
    }
    return max;
  }, 0);

  return productsTotal + maxShipping;
};

const CART_STORAGE_KEY = 'eurekka_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      const { items, total } = JSON.parse(savedCart);
      dispatch({ type: 'CLEAR_CART' });
      items.forEach((item: CartItem) => {
        dispatch({ type: 'ADD_ITEM', payload: item.course });
      });
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = (item: Course | Book | Combo, quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: item, quantity });
  };

  const removeItem = (courseId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: courseId });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}