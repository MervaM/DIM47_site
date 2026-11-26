import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'dim47_cart_items';

const safeReadCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
};

const safeWriteCart = (items) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (err) {
    console.warn('Failed to save cart to localStorage:', err);
    return false;
  }
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(safeReadCart);

  useEffect(() => {
    safeWriteCart(cartItems);
  }, [cartItems]);

  const addToCart = (newItem) => {
    if (!newItem || !newItem.cartItemKey) return;
    const qtyToAdd = Math.max(1, Number(newItem.quantity) || 1);

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.cartItemKey === newItem.cartItemKey
      );
      if (existingIdx !== -1) {
        return prev.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: qtyToAdd }];
    });
  };

  const updateQuantity = (cartItemKey, nextQty) => {
    if (nextQty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.cartItemKey !== cartItemKey));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemKey === cartItemKey ? { ...item, quantity: nextQty } : item
      )
    );
  };

  const removeFromCart = (cartItemKey) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemKey !== cartItemKey));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalCount,
        totalPrice,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);