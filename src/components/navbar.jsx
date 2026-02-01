import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/cartcontext.jsx";

export default function Navbar() {
  const cart = useCart();
  const nav = useNavigate();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-primary text-lg">
          <span className="text-xl">🍰</span> CakeShop
        </Link>

        <nav className="flex items-center gap-5 text-sm font-semibold">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/cakes">Our Cakes</NavItem>

          <button
            onClick={() => nav("/cart")}
            className="bg-primary text-white px-4 py-2 rounded-xl font-bold shadow-soft"
          >
            Cart ({cart.count()})
          </button>

          <NavItem to="/about">About</NavItem>
        </nav>
      </div>
    </header>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `hover:text-primary transition ${
          isActive ? "text-primary" : "text-gray-700"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
