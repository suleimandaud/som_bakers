import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { buildWhatsAppLink } from "../lib/whatsapp.js";

const CATEGORIES = ["All", "Birthday", "Wedding", "Cupcakes", "Custom"];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=1400&q=80"; // nice cake close-up

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
  // make unique categories from featured cakes
  const map = new Map(); // lowerCase => original
  featured.forEach((c) => {
    const raw = (c.category || "").trim();
    if (!raw) return;
    const key = raw.toLowerCase();
    if (!map.has(key)) map.set(key, raw);
  });

  return ["All", ...Array.from(map.values()).sort((a, b) => a.localeCompare(b))];
}, [featured]);


  useEffect(() => {
    (async () => {
      setLoading(true);

      // Prefer featured=true, fallback to latest
      const { data: featuredData } = await supabase
        .from("cakes")
        .select("*")
        .eq("available", true)
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (featuredData?.length) {
        setFeatured(featuredData);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("cakes")
        .select("*")
        .eq("available", true)
        .order("created_at", { ascending: false })
        .limit(8);

      setFeatured(data || []);
      setLoading(false);
    })();
  }, []);

  const generalLink = buildWhatsAppLink(
    "Hello, I'd like to order a cake. Please share today's available options."
  );

  // Filter (front-end) using cake.category
 const filtered = useMemo(() => {
  if (activeCategory === "All") return featured;

  return featured.filter((c) => {
    const ccat = (c.category || "").trim().toLowerCase();
    return ccat === activeCategory.trim().toLowerCase();
  });
}, [featured, activeCategory]);

  return (
    <div className="min-h-screen bg-soft">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* HERO (like your screenshot) */}
        <section className="relative overflow-hidden rounded-[28px] bg-black shadow-soft">
          <img
            src={HERO_IMAGE}
            alt="Cake hero"
            className="h-[220px] sm:h-[280px] md:h-[340px] w-full object-cover opacity-90"
          />

          {/* overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow">
              Sweet Cravings
            </h1>
            <p className="mt-2 text-white/85 text-sm sm:text-base max-w-xl">
              Handcrafted cakes for your special moments
            </p>

            <Link
              to="/cakes"
              className="mt-4 inline-flex items-center justify-center
                         bg-pink-500 hover:bg-pink-600 text-white font-bold
                         px-6 py-2.5 rounded-full shadow-soft transition"
            >
              Order Now
            </Link>
          </div>
        </section>

        {/* Category Chips */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={
                  "px-4 py-2 rounded-full text-sm font-semibold transition border " +
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

        {/* Featured header (like screenshot) */}
        <div className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Featured Cakes
              </h2>
              <p className="text-xs text-gray-500">
                Freshly baked daily with love
              </p>
            </div>

            <a
              href={generalLink}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-bold
                         bg-white border border-gray-200 px-4 py-2 rounded-full
                         hover:bg-white/70 transition"
            >
              <span className="text-green-600">●</span> WhatsApp
            </a>
          </div>

          {/* Featured list cards (tall image + bottom details + WhatsApp bar) */}
          {loading ? (
            <div className="mt-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
                  <div className="h-[260px] sm:h-[320px] bg-gray-100" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 mt-2" />
                    <div className="h-10 bg-gray-100 rounded-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-gray-700">
                No cakes found in <b>{activeCategory}</b>.
              </p>
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveCategory("All")}
                  className="btn-outline"
                >
                  Show All
                </button>
                <Link to="/cakes" className="btn-primary">
                  Go to Cakes
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {filtered.map((c) => (
                <FeaturedCakeCard key={c.id} cake={c} />
              ))}
            </div>
          )}
        </div>

        {/* Testimonials (like screenshot bottom section) */}
        <section className="mt-10">
          <h3 className="text-sm font-bold text-gray-800">
            What our customers say
          </h3>

          <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm text-gray-700 italic">
              “The cake was so fresh and not too sweet. Ordering via WhatsApp
              was incredibly easy!”
            </p>
            <p className="mt-2 text-xs font-bold text-pink-600">— Sarah M.</p>
          </div>
        </section>

        {/* Footer (simple like screenshot) */}
        <footer className="mt-10 pb-10 text-center">
          <div className="text-xs text-gray-500">
            Open Daily: 9AM – 8PM
          </div>
          <div className="mt-1 text-xs text-gray-400">
            © {new Date().getFullYear()} CakeShop. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeaturedCakeCard({ cake }) {
  const name = cake.name || "Cake";
  const desc =
    cake.description ||
    "Fresh seasonal ingredients with a signature cream frosting.";
  const price = Number(cake.price || 0).toFixed(2);

  const waMessage = [
    "Hello, I want to order this cake:",
    "",
    `Cake: ${name}`,
    `Price: $${price}`,
    `Category: ${cake.category || "N/A"}`,
    "",
    "Please confirm availability. Thank you!",
  ].join("\n");

  const waLink = buildWhatsAppLink(waMessage);

  return (
    <article className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm">
      <div className="relative">
        <img
          src={cake.image_url || "https://via.placeholder.com/1200x800?text=Cake"}
          alt={name}
          className="h-[280px] sm:h-[360px] w-full object-cover"
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-extrabold text-gray-900 truncate">{name}</h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{desc}</p>
          </div>

          <div className="text-sm font-extrabold text-pink-600 whitespace-nowrap">
            ${price}
          </div>
        </div>

        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 w-full inline-flex items-center justify-center gap-2
                     bg-pink-500 hover:bg-pink-600 text-white font-extrabold
                     px-4 py-3 rounded-full transition"
        >
          <span className="text-white/95">🟢</span>
          Order via WhatsApp
        </a>
      </div>
    </article>
  );
}
