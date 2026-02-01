import { Outlet, NavLink } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";

export default function AdminLayout() {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-soft flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 p-4 flex flex-col">
        <div>
          <div className="font-extrabold text-primary text-lg">
            Sweet Treats
          </div>
          <div className="text-xs text-pink-500 font-bold">
            ADMIN PANEL
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          <SideLink to="/admin" end>Dashboard</SideLink>
          <SideLink to="/admin/cakes">Manage Cakes</SideLink>
          <SideLink to="/admin/orders">Order History</SideLink>
        </nav>

        <div className="mt-auto space-y-3">
          <div className="bg-soft rounded-xl p-3 text-xs">
            <div className="font-bold text-gray-700">Secure Access</div>
            <div className="text-gray-500">Session Active</div>
          </div>

          <button
            onClick={logout}
            className="w-full bg-pink-500 hover:bg-pink-600
                       text-white font-extrabold px-4 py-2 rounded-xl"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

function SideLink({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block px-4 py-2 rounded-xl font-bold transition ${
          isActive
            ? "bg-pink-500 text-white"
            : "text-gray-700 hover:bg-soft"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
