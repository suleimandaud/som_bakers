import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { buildWhatsAppLink } from "../lib/whatsapp.js";
import { useCart } from "../context/cartcontext.jsx";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=1400&q=80";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const map = new Map(); // lower => original
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
        .limit(10);

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
        .limit(10);

      setFeatured(data || []);
      setLoading(false);
    })();
  }, []);

  const generalLink = buildWhatsAppLink(
    "Hello, I'd like to order a cake. Please share today's available options."
  );

  const filtered = useMemo(() => {
    if (activeCategory === "All") return featured;
    return featured.filter((c) => {
      const ccat = (c.category || "").trim().toLowerCase();
      return ccat === activeCategory.trim().toLowerCase();
    });
  }, [featured, activeCategory]);

  return (
    <div className="min-h-screen bg-soft">
      <div className="max-w-6xl mx-auto px-4 py-5 sm:py-6">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[22px] sm:rounded-[28px] bg-black shadow-soft">
          <img
            src={HERO_IMAGE}
            alt="Cake hero"
            className="h-[180px] sm:h-[260px] md:h-[340px] w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
            <h1 className="text-white text-[26px] sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow">
              Sweet Cravings
            </h1>
            <p className="mt-2 text-white/85 text-[12px] sm:text-base max-w-xl">
              Handcrafted cakes for your special moments
            </p>

            <Link
              to="/cakes"
              className="mt-4 inline-flex items-center justify-center
                         bg-pink-500 hover:bg-pink-600 text-white font-extrabold
                         px-6 py-2.5 rounded-full shadow-soft transition"
            >
              Order Now
            </Link>
          </div>
        </section>

        {/* Category Chips (scrollable on mobile) */}
        <div className="mt-4 -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 w-max">
            {categories.map((cat) => {
              const active = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={
                    "px-4 py-2 rounded-full text-sm font-bold transition border whitespace-nowrap " +
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
        </div>

        {/* Featured Header */}
        <div className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Featured Cakes</h2>
              <p className="text-xs text-gray-500">Freshly baked daily with love</p>
            </div>

            {/* show on desktop */}
            <a
              href={generalLink}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-bold
                         bg-white border border-gray-200 px-4 py-2 rounded-full
                         hover:bg-white/70 transition"
            >
              {/* <span className="text-green-600">●</span> WhatsApp */}
            </a>
          </div>

          {/* ✅ Mobile: swipe carousel | Desktop: grid */}
          {loading ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-pulse"
                >
                  <div className="h-[200px] bg-gray-100" />
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
                <button onClick={() => setActiveCategory("All")} className="btn-outline">
                  Show All
                </button>
                <Link to="/cakes" className="btn-primary">
                  Go to Cakes
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* MOBILE SWIPE */}
              <div className="mt-4 sm:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
                <div className="flex gap-4 w-max snap-x snap-mandatory">
                  {filtered.map((c) => (
                    <div key={c.id} className="snap-start">
                      <FeaturedCakeCard cake={c} compact />
                    </div>
                  ))}
                </div>
              </div>

              {/* DESKTOP GRID */}
              <div className="hidden sm:grid mt-4 grid-cols-2 gap-5">
                {filtered.map((c) => (
                  <FeaturedCakeCard key={c.id} cake={c} />
                ))}
              </div>

              {/* mobile WhatsApp quick button */}
              {/* <a
                href={generalLink}
                target="_blank"
                rel="noreferrer"
                className="sm:hidden mt-4 w-full inline-flex items-center justify-center gap-2
                           bg-white border border-gray-200 px-4 py-3 rounded-full font-extrabold
                           hover:bg-white/70 transition"
              >
                <span className="text-green-600">●</span> WhatsApp to Order
              </a> */}
            </>
          )}
        </div>

        {/* ✅ Testimonials (new style) */}
        {/* ✅ CTA Banner (like the image) */}
<section className="mt-10">
  <div className="rounded-[22px] sm:rounded-[26px] bg-pink-500 px-5 py-6 sm:px-10 sm:py-8 text-center text-white shadow-soft">
    <h3 className="text-lg sm:text-2xl font-extrabold leading-tight">
      Want a custom cake for your <br className="hidden sm:block" />
      special occasion?
    </h3>

    <p className="mt-2 text-[12px] sm:text-sm text-white/90 max-w-2xl mx-auto">
      Place your wedding, birthday, or corporate event orders.
      We handle everything from design to delivery.
    </p>

    <a
      href={buildWhatsAppLink(
        "Hello, I want to order a custom cake. Here are my details:\n\nOccasion:\nDate:\nTheme/Design:\nSize:\nBudget:\nDelivery Address:\n\nThank you!"
      )}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex items-center justify-center gap-2
                 bg-white text-pink-600 font-extrabold
                 px-5 py-2.5 rounded-full shadow-sm hover:bg-white/90 transition"
    >
      <span className="text-green-600">●</span>
      Order Custom Cake
    </a>
  </div>
</section>


        {/* Footer */}
        <footer className="mt-10 pb-10 text-center">
          <div className="text-xs text-gray-500">Open Daily: 9AM – 8PM</div>
          <div className="mt-1 text-xs text-gray-400">
            © {new Date().getFullYear()} CakeShop. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeaturedCakeCard({ cake, compact = false }) {
  const cart = useCart();

  const name = cake.name || "Cake";
  const desc =
    cake.description || "Fresh seasonal ingredients with a signature cream frosting.";
  const price = Number(cake.price || 0).toFixed(2);

  return (
    <article
      className={
        "bg-white rounded-[26px] overflow-hidden border border-gray-100 shadow-sm " +
        (compact ? "w-[300px]" : "")
      }
    >
      <div className="relative">
        <img
          src={cake.image_url || "https://via.placeholder.com/1200x800?text=Cake"}
          alt={name}
          className={
            (compact ? "h-[170px]" : "h-[240px] md:h-[260px]") +
            " w-full object-cover"
          }
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

        {/* ✅ ADD TO CART BUTTON */}
        <button
          onClick={() =>
            cart.addItem({
  id: cake.id,
  name: cake.name,
  price: Number(cake.price),
  image_url: cake.image_url,
})

          }
          className="mt-4 w-full inline-flex items-center justify-center gap-2
                     bg-pink-500 hover:bg-pink-600 text-white font-extrabold
                     px-4 py-3 rounded-full transition active:scale-[0.98]"
        >
          🛒 Add to Cart
        </button>
      </div>
    </article>
  );
}


function TestimonialCard({ name, text }) {
  const initials = (name || "A").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 w-[300px] sm:w-auto snap-start">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-extrabold flex items-center justify-center">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-gray-900 truncate">{name}</div>
          <div className="text-xs text-yellow-500">★★★★★</div>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-700 leading-relaxed">
        “{text}”
      </p>
    </div>
  );
}
