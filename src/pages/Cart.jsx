import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/cartcontext.jsx";
import { supabase } from "../lib/supabase.js";
import { buildCartMessage, buildWhatsAppLink } from "../lib/whatsapp.js";

const DELIVERY_FEE = 5;

const TIME_OPTIONS = [
  "Morning (9AM-12PM)",
  "Afternoon (12PM-4PM)",
  "Evening (4PM-8PM)",
];

function sanitizePhone(input) {
  return (input || "").replace(/[^\d+]/g, "");
}

function makeUUID() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function Cart() {
  const cart = useCart();

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    deliveryDate: "",
    preferredTime: TIME_OPTIONS[0],
    message: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => cart.total(), [cart]);
  const total = useMemo(
    () => subtotal + (cart.items.length ? DELIVERY_FEE : 0),
    [subtotal, cart.items.length]
  );

  async function checkoutWhatsApp() {
    setError("");

    if (cart.items.length === 0) return setError("Your cart is empty.");

    const name = customer.name.trim();
    const phoneClean = sanitizePhone(customer.phone);

    if (!name || !phoneClean) return setError("Name and phone are required.");
    if (phoneClean.replace("+", "").length < 8) return setError("Please enter a valid phone number.");

    setLoading(true);

    try {
      const notesCombined = [
        customer.message?.trim() ? `Message: ${customer.message.trim()}` : null,
        customer.deliveryDate ? `Delivery Date: ${customer.deliveryDate}` : null,
        customer.preferredTime ? `Preferred Time: ${customer.preferredTime}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      // ✅ IMPORTANT: generate order id locally so we don't need SELECT (RLS)
      const orderId = makeUUID();

      // ✅ 1) Insert order WITHOUT .select()
      const { error: orderErr } = await supabase.from("orders").insert([
        {
          id: orderId, // make sure orders.id is uuid in DB
          customer_name: name,
          customer_phone: phoneClean,
          address: customer.address?.trim() || null,
          notes: notesCombined || null,
          total_price: Number(total.toFixed(2)),
          status: "pending",
        },
      ]);

      if (orderErr) throw orderErr;

      // ✅ 2) Insert order items WITHOUT reading anything back
      const itemsPayload = cart.items.map((it) => ({
        order_id: orderId,
        cake_id: it.id,
        cake_name_snapshot: it.name,
        price_snapshot: Number(it.price),
        qty: Number(it.qty),
        line_total: Number((Number(it.price) * Number(it.qty)).toFixed(2)),
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      // ✅ 3) WhatsApp redirect
      const message = buildCartMessage({
        customer: {
          name,
          phone: phoneClean,
          address: customer.address,
          notes: notesCombined,
        },
        items: cart.items,
        total,
      });

      const waLink = buildWhatsAppLink(message);

      cart.clear();
      window.location.href = waLink; // mobile-safe
    } catch (e) {
      console.error("Checkout error:", e);

      const msg =
        e?.message ||
        e?.error_description ||
        e?.details ||
        e?.hint ||
        JSON.stringify(e);

      setError(msg || "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Review Your Order
        </h1>
        <p className="text-sm text-pink-600 mt-1">
          Finalize your sweet selection and send it to us via WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Items */}
        <div className="lg:col-span-7">
          {cart.items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-gray-700 font-semibold">Your cart is empty.</p>
              <Link to="/cakes" className="btn-outline inline-block mt-3">
                Back to Bakery
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((it) => (
                <div
                  key={it.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-3 items-center"
                >
                  <img
                    src={it.image_url || "https://via.placeholder.com/120?text=Cake"}
                    alt={it.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-gray-900 truncate">
                      {it.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      ${Number(it.price).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 truncate">
                      Quantity: {it.qty}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="w-8 h-8 rounded-full border border-pink-200 text-pink-600 font-extrabold hover:bg-soft transition"
                      onClick={() => cart.decrease(it.id)}
                    >
                      −
                    </button>

                    <div className="w-10 h-8 rounded-full bg-soft border border-pink-100 flex items-center justify-center font-extrabold text-gray-800">
                      {it.qty}
                    </div>

                    <button
                      className="w-8 h-8 rounded-full border border-pink-200 text-pink-600 font-extrabold hover:bg-soft transition"
                      onClick={() => cart.addItem(it)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="ml-1 text-xs font-bold text-pink-500 hover:text-pink-600"
                    onClick={() => cart.removeItem(it.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="mt-4">
                <Link
                  to="/cakes"
                  className="text-sm font-bold text-pink-600 hover:underline"
                >
                  ← Back to Bakery
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <h2 className="font-extrabold text-gray-900">Delivery Details</h2>

            <div className="mt-4 space-y-3">
              <Field label="Your Name">
                <input
                  autoComplete="name"
                  className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="Ali Mohamed"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
              </Field>

              <Field label="Phone Number">
                <input
                  inputMode="tel"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="+25261xxxxxxx"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Delivery Date">
                  <input
                    type="date"
                    className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    value={customer.deliveryDate}
                    onChange={(e) =>
                      setCustomer({ ...customer, deliveryDate: e.target.value })
                    }
                  />
                </Field>

                <Field label="Preferred Time">
                  <select
                    className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    value={customer.preferredTime}
                    onChange={(e) =>
                      setCustomer({ ...customer, preferredTime: e.target.value })
                    }
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Address (optional)">
                <input
                  className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="Street / District"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
              </Field>

              <Field label="Message to Baker">
                <textarea
                  className="w-full min-h-[90px] rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="Any delivery notes..."
                  value={customer.message}
                  onChange={(e) => setCustomer({ ...customer, message: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-gray-600 mt-2">
                <span>Estimated Delivery</span>
                <span>${cart.items.length ? DELIVERY_FEE.toFixed(2) : "0.00"}</span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="font-extrabold text-gray-900">Total</span>
                <span className="font-extrabold text-pink-600 text-lg">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-3 text-sm font-bold text-red-600 break-words">
                {error}
              </div>
            )}

            <button
              disabled={loading || cart.items.length === 0}
              onClick={checkoutWhatsApp}
              className="mt-5 w-full inline-flex items-center justify-center gap-2
                         bg-green-500 hover:bg-green-600 text-white font-extrabold
                         px-4 py-3 rounded-full transition shadow-soft disabled:opacity-50"
            >
              🟢 {loading ? "Processing..." : "Place Order via WhatsApp"}
            </button>

            <p className="mt-2 text-[10px] text-center text-gray-400 font-semibold tracking-wide">
              ORDERS ARE FINALIZED MANUALLY THROUGH WHATSAPP CHAT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray-700 mb-1">{label}</div>
      {children}
    </div>
  );
}
