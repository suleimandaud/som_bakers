import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase.js";

const PAGE_SIZE = 8;

const STATUS_TABS = ["All", "pending", "confirmed", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [itemsByOrder, setItemsByOrder] = useState({});
  const [loading, setLoading] = useState(true);

  // UI
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(1);

  // Details drawer
  const [openOrder, setOpenOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  async function fetchOrders() {
    setLoading(true);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    const ordersList = ordersData || [];
    setOrders(ordersList);

    if (ordersList.length > 0) {
      const ids = ordersList.map((o) => o.id);
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", ids);

      const map = {};
      (itemsData || []).forEach((it) => {
        map[it.order_id] = map[it.order_id] || [];
        map[it.order_id].push(it);
      });
      setItemsByOrder(map);
    } else {
      setItemsByOrder({});
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => setPage(1), [activeTab, search]);

  async function updateStatus(orderId, status) {
    setUpdating(true);
    await supabase.from("orders").update({ status }).eq("id", orderId);
    await fetchOrders();

    // keep drawer in sync
    const updated = orders.find((o) => o.id === orderId);
    setOpenOrder(updated ? { ...updated, status } : null);

    setUpdating(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((o) => {
      const matchesTab = activeTab === "All" ? true : o.status === activeTab;

      const matchesSearch =
        !q ||
        String(o.id).toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.customer_phone || "").toLowerCase().includes(q) ||
        (o.status || "").toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(filtered.length, page * PAGE_SIZE);

  return (
    <div className="min-h-[calc(100vh-48px)]">
      {/* Top search bar row */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-400">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order id, customer name, phone, status..."
            className="w-full outline-none text-sm"
          />
        </div>

        <button className="w-9 h-9 rounded-full bg-soft flex items-center justify-center">
          🔔
        </button>
        <button className="w-9 h-9 rounded-full bg-soft flex items-center justify-center">
          🌙
        </button>
      </div>

      {/* Title */}
      <div className="mt-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Order History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track WhatsApp orders saved from checkout. Update status as you confirm deliveries.
        </p>
      </div>

      {/* Status tabs */}
      <div className="mt-5 flex items-center gap-6 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((t) => {
          const active = t === activeTab;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={
                "pb-3 text-sm font-extrabold whitespace-nowrap " +
                (active ? "text-pink-600 border-b-2 border-pink-500" : "text-gray-500")
              }
            >
              {t === "All" ? `All Orders (${orders.length})` : t}
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <div className="mt-6 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[140px_1.4fr_160px_140px_140px] gap-3 px-5 py-4 text-xs font-extrabold text-gray-500 border-b border-gray-100">
          <div>ORDER ID</div>
          <div>CUSTOMER</div>
          <div>PHONE</div>
          <div>TOTAL</div>
          <div className="text-right">STATUS</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading orders...</div>
        ) : paged.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No orders found.</div>
        ) : (
          paged.map((o) => (
            <button
              key={o.id}
              onClick={() => setOpenOrder(o)}
              className="w-full text-left grid grid-cols-[140px_1.4fr_160px_140px_140px] gap-3 px-5 py-4 border-b border-gray-50 items-center hover:bg-soft transition"
            >
              <div className="font-extrabold text-gray-900">#{o.id}</div>

              <div className="min-w-0">
                <div className="font-extrabold text-gray-900 truncate">
                  {o.customer_name || "—"}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(o.created_at)}
                </div>
              </div>

              <div className="text-sm font-bold text-gray-700">
                {o.customer_phone || "—"}
              </div>

              <div className="font-extrabold text-gray-900">
                ${Number(o.total_price || 0).toFixed(2)}
              </div>

              <div className="flex justify-end">
                <span className={statusPill(o.status)}>{o.status}</span>
              </div>
            </button>
          ))
        )}

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-gray-500">
            Showing {showingFrom}-{showingTo} of {filtered.length} orders
          </div>

          <div className="flex items-center gap-2">
            <PageBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ‹
            </PageBtn>

            {getPageButtons(page, totalPages).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={
                  "w-9 h-9 rounded-xl border text-sm font-extrabold transition " +
                  (p === page
                    ? "bg-pink-500 text-white border-pink-500"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-soft")
                }
              >
                {p}
              </button>
            ))}

            <PageBtn
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </PageBtn>
          </div>
        </div>
      </div>

      {/* Right drawer */}
      {openOrder && (
        <div className="fixed inset-0 z-50">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpenOrder(null)}
          />

          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-full sm:w-[460px] bg-white border-l border-gray-100 shadow-soft">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 font-bold">ORDER</div>
                <div className="text-xl font-extrabold text-gray-900">
                  #{openOrder.id}
                </div>
              </div>

              <button
                onClick={() => setOpenOrder(null)}
                className="w-10 h-10 rounded-xl bg-soft border border-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-auto h-[calc(100%-80px)]">
              <div className="bg-soft rounded-2xl p-4 border border-pink-100">
                <div className="text-xs font-extrabold text-gray-700">Customer</div>
                <div className="mt-1 font-extrabold text-gray-900">
                  {openOrder.customer_name || "—"}
                </div>
                <div className="text-sm text-gray-600">
                  {openOrder.customer_phone || "—"}
                </div>
                {openOrder.address && (
                  <div className="text-sm text-gray-600 mt-1">
                    📍 {openOrder.address}
                  </div>
                )}
                {openOrder.notes && (
                  <div className="text-sm text-gray-600 mt-1">
                    📝 {openOrder.notes}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-gray-700">Status</div>
                  <span className={statusPill(openOrder.status)}>{openOrder.status}</span>
                </div>

                <select
                  value={openOrder.status}
                  onChange={(e) => updateStatus(openOrder.id, e.target.value)}
                  disabled={updating}
                  className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold outline-none"
                >
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>

                <div className="mt-3 text-sm text-gray-700 font-extrabold">
                  Total: ${Number(openOrder.total_price || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(openOrder.created_at)}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="text-xs font-extrabold text-gray-700">Items</div>

                <div className="mt-3 space-y-2">
                  {(itemsByOrder[openOrder.id] || []).map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">
                          {it.cake_name_snapshot}
                        </div>
                        <div className="text-xs text-gray-500">
                          Qty: {it.qty} • ${Number(it.price_snapshot || 0).toFixed(2)} each
                        </div>
                      </div>

                      <div className="font-extrabold text-gray-900">
                        ${Number(it.line_total || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}

                  {(itemsByOrder[openOrder.id] || []).length === 0 && (
                    <div className="text-sm text-gray-500">No items found.</div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Orders are finalized manually through WhatsApp chat.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-700 font-extrabold
                 hover:bg-soft disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function getPageButtons(current, total) {
  const start = Math.max(1, current - 1);
  const end = Math.min(total, current + 2);
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusPill(status) {
  const s = (status || "").toLowerCase();

  if (s === "pending")
    return "text-[10px] font-extrabold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700";
  if (s === "confirmed")
    return "text-[10px] font-extrabold px-2 py-1 rounded-full bg-blue-100 text-blue-700";
  if (s === "delivered")
    return "text-[10px] font-extrabold px-2 py-1 rounded-full bg-green-100 text-green-700";
  if (s === "cancelled")
    return "text-[10px] font-extrabold px-2 py-1 rounded-full bg-red-100 text-red-700";

  return "text-[10px] font-extrabold px-2 py-1 rounded-full bg-gray-100 text-gray-700";
}
