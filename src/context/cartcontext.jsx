import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const LS_KEY = "cake_cart_v1";

function loadCart() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const api = useMemo(() => {
    function addItem(cake) {
      setItems((prev) => {
        const found = prev.find((x) => x.id === cake.id);
        if (found) {
          return prev.map((x) => (x.id === cake.id ? { ...x, qty: x.qty + 1 } : x));
        }
        return [...prev, { id: cake.id, name: cake.name, price: Number(cake.price), image_url: cake.image_url, qty: 1 }];
      });
    }

    function removeItem(id) {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }

    function setQty(id, qty) {
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))
      );
    }

    function clear() {
      setItems([]);
    }

    function total() {
      return items.reduce((sum, it) => sum + it.price * it.qty, 0);
    }

    function count() {
      return items.reduce((sum, it) => sum + it.qty, 0);
    }

    return { items, addItem, removeItem, setQty, clear, total, count };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
