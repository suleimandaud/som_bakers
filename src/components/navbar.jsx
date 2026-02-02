import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/cartcontext.jsx";

export default function Navbar() {
  const cart = useCart();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const count = cart.count();
  const hasItems = count > 0;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-extrabold text-primary text-lg">
          <span className="text-xl">🍰</span> SOM BAKERS
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/cakes">Our Cakes</NavItem>
          <NavItem to="/about">About</NavItem>

          <button
            onClick={() => nav("/cart")}
            className={
              "px-4 py-2 rounded-xl font-extrabold shadow-soft transition " +
              (hasItems ? "bg-primary text-white" : "bg-soft text-gray-800 border border-pink-100")
            }
          >
            Cart ({count})
          </button>
        </nav>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => nav("/cart")}
            className={
              "relative w-10 h-10 rounded-xl flex items-center justify-center shadow-soft transition " +
              (hasItems ? "bg-primary text-white" : "bg-soft text-gray-800 border border-pink-100")
            }
            aria-label="Cart"
          >
            🛒
            {hasItems && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-[11px] font-extrabold flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          <button
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 rounded-xl bg-soft border border-pink-100 flex items-center justify-center"
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 text-sm font-semibold">
            <MobileNavItem to="/" onClick={() => setOpen(false)}>Home</MobileNavItem>
            <MobileNavItem to="/cakes" onClick={() => setOpen(false)}>Our Cakes</MobileNavItem>
            <MobileNavItem to="/about" onClick={() => setOpen(false)}>About</MobileNavItem>
          </div>
        </div>
      )}
    </header>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `hover:text-primary transition ${isActive ? "text-primary" : "text-gray-700"}`
      }
    >
      {children}
    </NavLink>
  );
}

function MobileNavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        "py-2 px-3 rounded-xl transition " +
        (isActive ? "bg-soft text-primary" : "text-gray-800 hover:bg-soft")
      }
    >
      {children}
    </NavLink>
  );
}
