import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/cartcontext.jsx";
import { supabase } from "../lib/supabase.js";
import { buildCartMessage, buildWhatsAppLink } from "../lib/whatsapp.js";

const DELIVERY_FEE = 5; // matches screenshot idea

const TIME_OPTIONS = [
  "Morning (9AM-12PM)",
  "Afternoon (12PM-4PM)",
  "Evening (4PM-8PM)",
];

export default function Cart() {
  const cart = useCart();

  // UI fields (match screenshot)
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    deliveryDate: "",
    preferredTime: TIME_OPTIONS[0],
    message: "",
    address: "", // optional (you already store it)
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => cart.total(), [cart]);
  const total = useMemo(() => subtotal + (cart.items.length ? DELIVERY_FEE : 0), [subtotal, cart.items.length]);

  async function checkoutWhatsApp() {
    setError("");

    if (cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!customer.name.trim() || !customer.phone.trim()) {
      setError("Name and phone are required.");
      return;
    }

    setLoading(true);

    try {
      // Combine the right-panel fields into notes so admin can see them
      const notesCombined = [
        customer.message?.trim() ? `Message: ${customer.message.trim()}` : null,
        customer.deliveryDate ? `Delivery Date: ${customer.deliveryDate}` : null,
        customer.preferredTime ? `Preferred Time: ${customer.preferredTime}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      // 1) Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: customer.name.trim(),
            customer_phone: customer.phone.trim(),
            address: customer.address?.trim() || null,
            notes: notesCombined || null,
            total_price: Number(total.toFixed(2)),
            status: "pending",
          },
        ])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2) Create order items
      const itemsPayload = cart.items.map((it) => ({
        order_id: order.id,
        cake_id: it.id,
        cake_name_snapshot: it.name,
        price_snapshot: Number(it.price),
        qty: it.qty,
        line_total: Number((it.price * it.qty).toFixed(2)),
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      // 3) Build WhatsApp message and redirect
      const message = buildCartMessage({
        customer: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          notes: notesCombined, // goes into WhatsApp message as notes
        },
        items: cart.items,
        total,
      });

      const waLink = buildWhatsAppLink(message);

      cart.clear();
      window.open(waLink, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      setError("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Review Your Order</h1>
        <p className="text-sm text-pink-600 mt-1">
          Finalize your sweet selection and send it to us via WhatsApp.
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: items */}
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
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-4 items-center"
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
                    {/* Optional: mini note line like screenshot */}
                    <div className="text-[11px] text-gray-400 mt-1 truncate">
                      Quantity: {it.qty} • Cake
                    </div>
                  </div>

                  {/* Qty pill */}
                  <div className="flex items-center gap-2">
                    <button
                      className="w-8 h-8 rounded-full border border-pink-200 text-pink-600 font-extrabold hover:bg-soft transition"
                      onClick={() => cart.setQty(it.id, it.qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>

                    <div className="w-10 h-8 rounded-full bg-soft border border-pink-100 flex items-center justify-center font-extrabold text-gray-800">
                      {it.qty}
                    </div>

                    <button
                      className="w-8 h-8 rounded-full border border-pink-200 text-pink-600 font-extrabold hover:bg-soft transition"
                      onClick={() => cart.setQty(it.id, it.qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="ml-2 text-xs font-bold text-pink-500 hover:text-pink-600"
                    onClick={() => cart.removeItem(it.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="mt-4">
                <Link to="/cakes" className="text-sm font-bold text-pink-600 hover:underline">
                  ← Back to Bakery
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: delivery details */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <h2 className="font-extrabold text-gray-900">Delivery Details</h2>

            <div className="mt-4 space-y-3">
              <Field label="Your Name">
                <input
                  className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="Sarah Johnson"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
              </Field>

              <Field label="Phone Number">
                <input
                  className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="+1 (555) 000-0000"
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
                    onChange={(e) => setCustomer({ ...customer, deliveryDate: e.target.value })}
                  />
                </Field>

                <Field label="Preferred Time">
                  <select
                    className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    value={customer.preferredTime}
                    onChange={(e) => setCustomer({ ...customer, preferredTime: e.target.value })}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Optional address (your original spec) */}
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
                  placeholder="Any specific dietary requirements or delivery notes..."
                  value={customer.message}
                  onChange={(e) => setCustomer({ ...customer, message: e.target.value })}
                />
              </Field>
            </div>

            {/* Summary */}
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
              <div className="mt-3 text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              disabled={loading || cart.items.length === 0}
              onClick={checkoutWhatsApp}
              className={
                "mt-5 w-full inline-flex items-center justify-center gap-2 " +
                "bg-green-500 hover:bg-green-600 text-white font-extrabold " +
                "px-4 py-3 rounded-full transition shadow-soft disabled:opacity-50"
              }
            >
              <span className="text-white">🟢</span>
              {loading ? "Processing..." : "Place Order via WhatsApp"}
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
