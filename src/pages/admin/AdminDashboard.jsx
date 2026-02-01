import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    cakes: 0,
    orders: 0,
    whatsapp: 0,
  });

  useEffect(() => {
    (async () => {
      const { count: cakes } = await supabase
        .from("cakes")
        .select("id", { count: "exact", head: true });

      const { count: orders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true });

      // WhatsApp leads = pending orders
      const { count: whatsapp } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        cakes: cakes || 0,
        orders: orders || 0,
        whatsapp: whatsapp || 0,
      });
    })();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500">
            Welcome back! Here’s your bakery’s performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-soft flex items-center justify-center">
            🔔
          </div>
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
        <StatCard
          title="Total Cake Types"
          value={stats.cakes}
          change="+5%"
        />
        <StatCard
          title="Total Orders"
          value={stats.orders}
          change="+12%"
        />
        <StatCard
          title="WhatsApp Leads"
          value={stats.whatsapp}
          highlight
          badge="Live"
        />
      </div>

      {/* Bottom Panels */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="font-extrabold">Daily Website Visits</div>
          <div className="text-sm text-gray-500">
            Last 7 days activity
          </div>

          <div className="mt-6 h-32 flex items-center justify-center text-gray-400">
            📈 Chart placeholder
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-extrabold">Recent Inquiries</div>
            <span className="text-pink-500 text-sm font-bold cursor-pointer">
              View All
            </span>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <Inquiry
              cake="Strawberry Dream Cake"
              customer="Alice Johnson"
              status="WhatsApp"
            />
            <Inquiry
              cake="Double Chocolate Fudge"
              customer="Bob Smith"
              status="WhatsApp"
            />
            <Inquiry
              cake="Vanilla Cloud Cupcakes"
              customer="Maria Garcia"
              status="Pending"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, highlight, badge }) {
  return (
    <div
      className={`rounded-2xl p-5 border shadow-sm ${
        highlight
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-100"
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

      <div className="mt-2 text-3xl font-extrabold text-gray-900">
        {value}
      </div>

      {change && (
        <div className="mt-1 text-xs font-bold text-green-600">
          {change}
        </div>
      )}
    </div>
  );
}

function Inquiry({ cake, customer, status }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-bold text-gray-900">{cake}</div>
        <div className="text-xs text-gray-500">
          Customer: {customer}
        </div>
      </div>

      <span
        className={`text-xs font-bold px-2 py-1 rounded-full ${
          status === "WhatsApp"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
