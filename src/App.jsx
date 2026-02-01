import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/navbar.jsx";

// customer pages
import Home from "./pages/Home.jsx";
import Cakes from "./pages/Cakes.jsx";
import Cart from "./pages/Cart.jsx";
import About from "./pages/About.jsx";

// admin
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminCakes from "./pages/admin/AdminCakes.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {/* ❌ Hide navbar on admin routes */}
      {!isAdminRoute && <Navbar />}

      <Routes>
        {/* CUSTOMER */}
        <Route path="/" element={<Home />} />
        <Route path="/cakes" element={<Cakes />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/about" element={<About />} />

        {/* ADMIN */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="cakes" element={<AdminCakes />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
