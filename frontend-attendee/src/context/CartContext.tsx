import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

export interface CartItem {
  id: string; // generate unique id for list rendering
  ticketType: string;
  displayName: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (ticketType: string, displayName: string, price: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (ticketType: string, displayName: string, price: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.ticketType === ticketType);
      if (existing) {
        return prev.map(item => 
          item.ticketType === ticketType 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: Math.random().toString(36).substr(2, 9), ticketType, displayName, price, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const clearCart = useCallback(() => setCartItems([]), []);

  const getTotalItems = () => cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const getTotalPrice = () => cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
