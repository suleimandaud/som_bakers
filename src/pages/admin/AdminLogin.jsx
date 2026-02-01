import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function login(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErr("Invalid login.");
      return;
    }
    nav("/admin");
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", border: "1px solid #eee", borderRadius: 14, padding: 16, background: "white" }}>
      <h2 style={{ marginTop: 0 }}>Admin Login</h2>

      <form onSubmit={login} style={{ display: "grid", gap: 10 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={styles.input} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" style={styles.input} />

        {err && <p style={{ color: "crimson", fontWeight: 700 }}>{err}</p>}

        <button disabled={loading} style={styles.btn}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  input: { padding: 12, borderRadius: 10, border: "1px solid #ddd" },
  btn: { background: "#5B1742", color: "white", border: 0, padding: 12, borderRadius: 10, cursor: "pointer", fontWeight: 900 },
};
