import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ cakes: 0, orders: 0, whatsapp: 0 });

  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // ✅ for accounting

  const [loadingPanels, setLoadingPanels] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingPanels(true);

      // --- counts ---
      const { count: cakes } = await supabase
        .from("cakes")
        .select("id", { count: "exact", head: true });

      const { count: orders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true });

      const { count: whatsapp } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        cakes: cakes || 0,
        orders: orders || 0,
        whatsapp: whatsapp || 0,
      });

      // Recent orders
      const { data: ro } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      // Pending leads
      const { data: po } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(6);

      // Out of stock
      const { data: ls } = await supabase
        .from("cakes")
        .select("id,name,category,price,image_url,available,featured,created_at")
        .eq("available", false)
        .order("created_at", { ascending: false })
        .limit(6);

      // ✅ Fetch more orders for accounting
      const { data: ao } = await supabase
        .from("orders")
        .select("id,status,total_price,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      setRecentOrders(ro || []);
      setPendingOrders(po || []);
      setLowStock(ls || []);
      setAllOrders(ao || []);

      setLoadingPanels(false);
    })();
  }, []);

  // ✅ Accounting calculations (based on pending/confirmed/delivered/cancelled)
  const accounting = useMemo(() => {
    const orders = allOrders || [];
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(startOfDay);
    // Sunday-start week (0). If you want Monday, tell me.
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const toDate = (x) => {
      const d = new Date(x);
      return isNaN(d.getTime()) ? null : d;
    };

    const sum = (list) =>
      list.reduce((acc, o) => acc + Number(o.total_price || 0), 0);

    const byStatus = (s) =>
      orders.filter((o) => (o.status || "").toLowerCase() === s);

    const pending = byStatus("pending");
    const confirmed = byStatus("confirmed");
    const delivered = byStatus("delivered");
    const cancelled = byStatus("cancelled");

    const filterFrom = (list, start) =>
      list.filter((o) => {
        const d = toDate(o.created_at);
        return d && d >= start;
      });

    // ✅ Revenue = delivered فقط
    const deliveredToday = filterFrom(delivered, startOfDay);
    const deliveredWeek = filterFrom(delivered, startOfWeek);
    const deliveredMonth = filterFrom(delivered, startOfMonth);

    // ✅ Expected = confirmed
    const confirmedToday = filterFrom(confirmed, startOfDay);
    const confirmedWeek = filterFrom(confirmed, startOfWeek);
    const confirmedMonth = filterFrom(confirmed, startOfMonth);

    const totalDelivered = sum(delivered);
    const totalConfirmed = sum(confirmed);
    const pendingAmount = sum(pending);

    const avgDelivered = delivered.length > 0 ? totalDelivered / delivered.length : 0;

    return {
      // delivered revenue
      revenueToday: sum(deliveredToday),
      revenueWeek: sum(deliveredWeek),
      revenueMonth: sum(deliveredMonth),
      totalDelivered,

      // confirmed expected
      expectedToday: sum(confirmedToday),
      expectedWeek: sum(confirmedWeek),
      expectedMonth: sum(confirmedMonth),
      totalConfirmed,

      pendingAmount,
      avgDelivered,

      counts: {
        pending: pending.length,
        confirmed: confirmed.length,
        delivered: delivered.length,
        cancelled: cancelled.length,
      },
    };
  }, [allOrders]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Welcome back! Here’s your bakery’s performance.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-soft flex items-center justify-center">🔔</div>
          <div className="flex items-center gap-2 bg-soft px-3 py-2 rounded-full">
            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs">
              A
            </div>
            <div className="text-sm font-bold">Bakery Admin</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Cake Types" value={stats.cakes} />
        <StatCard title="Total Orders" value={stats.orders} />
        <StatCard title="WhatsApp Leads" value={stats.whatsapp} highlight badge="Live" />
      </div>

      {/* ✅ Accounting section */}
      <div className="mt-6">
        <Panel
          title="Accounting"
          subtitle="Revenue = delivered • Expected = confirmed • Pending = pending"
          right={
            <Link to="/admin/orders" className="text-sm font-extrabold text-pink-600 hover:underline">
              See orders →
            </Link>
          }
        >
          {loadingPanels ? (
            <PanelLoading />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MoneyCard label="Revenue Today (Delivered)" value={accounting.revenueToday} />
                <MoneyCard label="Revenue This Week (Delivered)" value={accounting.revenueWeek} />
                <MoneyCard label="Revenue This Month (Delivered)" value={accounting.revenueMonth} />

                <MoneyCard label="Total Delivered Revenue" value={accounting.totalDelivered} />
                <MoneyCard label="Total Confirmed (Expected)" value={accounting.totalConfirmed} />
                <MoneyCard label="Pending Amount" value={accounting.pendingAmount} danger />
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Pending: <b>{accounting.counts.pending}</b> • Confirmed:{" "}
                <b>{accounting.counts.confirmed}</b> • Delivered:{" "}
                <b>{accounting.counts.delivered}</b> • Cancelled:{" "}
                <b>{accounting.counts.cancelled}</b> • Avg Delivered Order:{" "}
                <b>${Number(accounting.avgDelivered || 0).toFixed(2)}</b>
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* Content */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          <Panel
            title="Recent Orders"
            subtitle="Latest orders coming from the website / WhatsApp"
            right={
              <Link to="/admin/orders" className="text-sm font-extrabold text-pink-600 hover:underline">
                View all
              </Link>
            }
          >
            {loadingPanels ? (
              <PanelLoading />
            ) : recentOrders.length === 0 ? (
              <EmptyState text="No orders yet." />
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="WhatsApp Leads (Pending)"
            subtitle="Orders that need your response"
            right={
              <span className="text-xs font-extrabold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Live
              </span>
            }
          >
            {loadingPanels ? (
              <PanelLoading />
            ) : pendingOrders.length === 0 ? (
              <EmptyState text="No pending leads. Great job!" />
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingOrders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <Panel title="Quick Actions" subtitle="Fast access to key admin tasks">
            <div className="grid grid-cols-1 gap-3">
              <Link
                to="/admin/cakes"
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-extrabold text-gray-900 hover:bg-soft transition flex items-center justify-between"
              >
                Manage Cakes <span>→</span>
              </Link>

              <Link
                to="/admin/orders"
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-extrabold text-gray-900 hover:bg-soft transition flex items-center justify-between"
              >
                View Orders <span>→</span>
              </Link>

              <Link
                to="/admin/cakes"
                className="rounded-2xl bg-pink-500 text-white px-4 py-3 font-extrabold hover:bg-pink-600 transition flex items-center justify-between"
              >
                + Add New Cake <span>🍰</span>
              </Link>
            </div>
          </Panel>

          <Panel title="Out of Stock" subtitle="Cakes marked as unavailable">
            {loadingPanels ? (
              <PanelLoading />
            ) : lowStock.length === 0 ? (
              <EmptyState text="No out-of-stock cakes." />
            ) : (
              <div className="space-y-3">
                {lowStock.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3"
                  >
                    <img
                      src={c.image_url || "https://via.placeholder.com/80?text=Cake"}
                      alt={c.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-gray-100"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-gray-900 truncate">{c.name || "Cake"}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {(c.category || "—").toUpperCase()} • ${Number(c.price || 0).toFixed(2)}
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Unavailable
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI pieces ---------------- */

function StatCard({ title, value, highlight, badge }) {
  return (
    <div
      className={`rounded-2xl p-5 border shadow-sm ${
        highlight ? "bg-green-50 border-green-200" : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-600">{title}</div>
        {badge && (
          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

function MoneyCard({ label, value, danger = false }) {
  return (
    <div
      className={
        "rounded-2xl border p-4 " +
        (danger ? "border-red-200 bg-red-50" : "border-gray-100 bg-white")
      }
    >
      <div className="text-xs font-bold text-gray-600">{label}</div>
      <div
        className={
          "mt-2 text-2xl font-extrabold " +
          (danger ? "text-red-600" : "text-gray-900")
        }
      >
        ${Number(value || 0).toFixed(2)}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, right, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <div className="font-extrabold text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PanelLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl bg-soft border border-gray-100 p-4 text-sm text-gray-600">
      {text}
    </div>
  );
}

function OrderRow({ order }) {
  const id = order.id ?? "—";
  const status = (order.status || "pending").toLowerCase();
  const created = order.created_at ? new Date(order.created_at).toLocaleString() : "";

  const customer =
    order.customer_name ||
    order.customer ||
    order.phone ||
    order.customer_phone ||
    "Customer";

  const total = Number(order.total_price || 0);

  const badge =
    status === "pending"
      ? "bg-yellow-100 text-yellow-700"
      : status === "confirmed"
      ? "bg-blue-100 text-blue-700"
      : status === "delivered"
      ? "bg-green-100 text-green-700"
      : status === "cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-700";

  return (
    <div className="py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-extrabold text-gray-900 truncate">
          Order #{String(id).slice(0, 8)}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {customer} {created ? `• ${created}` : ""}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-sm font-extrabold text-gray-900 whitespace-nowrap">
          ${total.toFixed(2)}
        </div>
        <span className={"text-xs font-extrabold px-2 py-1 rounded-full " + badge}>
          {status}
        </span>
      </div>
    </div>
  );
}
