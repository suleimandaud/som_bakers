import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/cartcontext.jsx";

export default function Navbar() {
  const cart = useCart();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const cartCount = cart.count();
  const cartHasItems = cartCount > 0;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-extrabold text-primary text-lg"
          onClick={() => setOpen(false)}
        >
          <span className="text-xl">🍰</span> CakeShop
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/cakes">Our Cakes</NavItem>

          <button
            onClick={() => nav("/cart")}
            className={
              "px-4 py-2 rounded-xl font-extrabold shadow-soft transition " +
              (cartHasItems
                ? "bg-primary text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-soft")
            }
          >
            Cart{cartHasItems ? ` (${cartCount})` : ""}
          </button>

          <NavItem to="/about">About</NavItem>
        </nav>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-2">
          {/* Cart icon button */}
          <button
            onClick={() => nav("/cart")}
            className={
              "relative h-10 w-10 rounded-xl flex items-center justify-center border transition " +
              (cartHasItems
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-200 hover:bg-soft")
            }
            aria-label="Cart"
            title="Cart"
          >
            🛒
            {cartHasItems && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-white text-primary text-[11px] font-extrabold flex items-center justify-center border border-primary">
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="h-10 w-10 rounded-xl border border-gray-200 bg-white hover:bg-soft flex items-center justify-center"
            aria-label="Menu"
            title="Menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 text-sm font-semibold">
            <MobileNavItem to="/" onClick={() => setOpen(false)}>
              Home
            </MobileNavItem>
            <MobileNavItem to="/cakes" onClick={() => setOpen(false)}>
              Our Cakes
            </MobileNavItem>
            <MobileNavItem to="/about" onClick={() => setOpen(false)}>
              About
            </MobileNavItem>

            {/* Big cart button in menu */}
            <button
              onClick={() => {
                setOpen(false);
                nav("/cart");
              }}
              className={
                "mt-2 w-full px-4 py-3 rounded-xl font-extrabold transition " +
                (cartHasItems
                  ? "bg-primary text-white shadow-soft"
                  : "bg-soft text-gray-800 border border-gray-200")
              }
            >
              {cartHasItems ? `Go to Cart (${cartCount})` : "Cart is empty"}
            </button>
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
        "hover:text-primary transition " + (isActive ? "text-primary" : "text-gray-700")
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
        "px-3 py-3 rounded-xl transition border " +
        (isActive
          ? "bg-soft border-gray-200 text-primary"
          : "bg-white border-transparent text-gray-800 hover:bg-soft hover:border-gray-200")
      }
    >
      {children}
    </NavLink>
  );
}
