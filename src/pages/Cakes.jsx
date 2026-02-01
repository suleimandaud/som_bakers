import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { useCart } from "../context/cartcontext.jsx";
import { buildWhatsAppLink } from "../lib/whatsapp.js";

const CATEGORIES = [
  "All Cakes",
  "Birthday",
  "Wedding",
  "Cupcakes",
  "Custom Designs",
];

const PAGE_SIZE = 8;

export default function Cakes() {
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeCategory, setActiveCategory] = useState("All Cakes");
  const [page, setPage] = useState(1);

  const cart = useCart();

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("cakes")
        .select("*")
        .eq("available", true)
        .order("created_at", { ascending: false });

      if (!error) setCakes(data || []);
      setLoading(false);
    })();
  }, []);

  // reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  const generalLink = buildWhatsAppLink(
    "Hello, I'd like to order a cake. Please share today's available options."
  );

  const categories = useMemo(() => {
  const set = new Set();
  cakes.forEach((c) => {
    const cat = (c.category || "").trim();
    if (cat) set.add(cat);
  });

  // Convert to array + sort A-Z
  return ["All Cakes", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}, [cakes]);


  // Map UI category names to DB values
  const filtered = useMemo(() => {
  if (activeCategory === "All Cakes") return cakes;
  return cakes.filter((c) => (c.category || "").trim() === activeCategory);
}, [cakes, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="h-8 w-64 bg-white/60 rounded-xl animate-pulse" />
            <div className="h-4 w-96 bg-white/60 rounded-xl mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-44 bg-white/60 rounded-full animate-pulse" />
        </div>

        <div className="mt-5 flex gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-28 bg-white/60 rounded-full animate-pulse" />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[26px] border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-5/6 mt-2" />
                <div className="h-10 bg-gray-100 rounded-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Our Sweet Collection
          </h1>
          <p className="mt-2 text-gray-600 text-sm">
            Artisanal cakes handcrafted daily. Direct delivery to your door.
          </p>
        </div>

        <a
          href={generalLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-white border border-gray-200
                     px-4 py-2 rounded-full font-bold text-sm hover:bg-white/70 transition"
        >
          <span className="text-pink-600">💬</span>
          Order via WhatsApp
        </a>
      </div>

      {/* Category chips */}
      <div className="mt-5 flex gap-2 flex-wrap">
{categories.map((cat) => {
          const active = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={
                "px-4 py-2 rounded-full text-sm font-bold transition border " +
                (active
                  ? "bg-pink-500 text-white border-pink-500"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-white/70")
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {paged.length === 0 ? (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-gray-700">
            No cakes found for <b>{activeCategory}</b>.
          </p>
          <button
            onClick={() => setActiveCategory("All Cakes")}
            className="btn-outline mt-3"
          >
            Show All Cakes
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {paged.map((c) => (
            <CakeCard key={c.id} cake={c} onAdd={() => cart.addItem(c)} />
          ))}
        </div>
      )}

      {/* Pagination (like screenshot) */}
      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="w-9 h-9 rounded-full bg-white border border-gray-200 font-bold disabled:opacity-40"
        >
          ‹
        </button>

        {/* show up to 5 page numbers */}
        {getPageButtons(page, totalPages).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={
              "w-9 h-9 rounded-full font-bold border transition " +
              (p === page
                ? "bg-pink-500 text-white border-pink-500"
                : "bg-white text-gray-700 border-gray-200 hover:bg-white/70")
            }
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="w-9 h-9 rounded-full bg-white border border-gray-200 font-bold disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function CakeCard({ cake, onAdd }) {
  const name = cake.name || "Cake";
  const price = Number(cake.price || 0);
  const desc =
    cake.description ||
    "Freshly baked with premium ingredients and signature frosting.";

  // Tag label like screenshot
  const tag = makeTag(cake);

  return (
    <div className="bg-white rounded-[26px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="relative p-3">
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={cake.image_url || "https://via.placeholder.com/800x600?text=Cake"}
            alt={name}
            className="h-44 w-full object-cover"
          />
        </div>

        {tag && (
          <span className="absolute top-5 left-5 text-[10px] font-extrabold tracking-wider
                           bg-white/90 text-pink-600 border border-pink-200
                           px-2 py-1 rounded-full">
            {tag}
          </span>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold text-gray-900 leading-snug line-clamp-2">
            {name}
          </h3>
          <div className="text-pink-600 font-extrabold whitespace-nowrap">
            ${price.toFixed(0)}
          </div>
        </div>

        <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">
          {desc}
        </p>

        <button
          onClick={onAdd}
          className="mt-4 w-full inline-flex items-center justify-center gap-2
                     bg-pink-500 hover:bg-pink-600 text-white font-extrabold
                     px-4 py-3 rounded-full transition"
        >
          <span className="text-white/95">🛒</span>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function makeTag(cake) {
  // If your DB has tags later, use them here.
  // For now we derive:
  const cat = (cake.category || "").toLowerCase();
  if (!cat) return null;

  if (cat.includes("birthday")) return "BIRTHDAY";
  if (cat.includes("wedding")) return "WEDDING";
  if (cat.includes("cupcake")) return "CUPCAKES";
  if (cat.includes("custom")) return "CUSTOM";

  // fallback
  return cat.toUpperCase().slice(0, 14);
}

function getPageButtons(current, total) {
  // show [current-2 ... current+2] within bounds
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}
