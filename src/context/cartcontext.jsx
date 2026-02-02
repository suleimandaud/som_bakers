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

function normalizeCake(cake) {
  return {
    id: cake.id,
    name: cake.name ?? "Cake",
    price: Number(cake.price ?? 0),
    image_url: cake.image_url ?? null,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("localStorage save failed:", e);
    }
  }, [items]);

  const api = useMemo(() => {
    function addItem(cake) {
      const c = normalizeCake(cake);
      setItems((prev) => {
        const found = prev.find((x) => x.id === c.id);
        if (found) {
          return prev.map((x) => (x.id === c.id ? { ...x, qty: x.qty + 1 } : x));
        }
        return [...prev, { ...c, qty: 1 }];
      });
    }

    function removeItem(id) {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }

    function setQty(id, qty) {
      const safeQty = Math.max(1, Number(qty || 1));
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty: safeQty } : x)));
    }

    function decrease(id) {
      setItems((prev) => {
        const found = prev.find((x) => x.id === id);
        if (!found) return prev;
        if (found.qty <= 1) return prev.filter((x) => x.id !== id);
        return prev.map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x));
      });
    }

    function clear() {
      setItems([]);
    }

    function total() {
      return items.reduce((sum, it) => sum + Number(it.price) * Number(it.qty), 0);
    }

    function count() {
      return items.reduce((sum, it) => sum + Number(it.qty), 0);
    }

    return { items, addItem, removeItem, setQty, decrease, clear, total, count };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
