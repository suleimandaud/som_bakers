import { buildWhatsAppLink } from "../lib/whatsapp.js";

export default function About() {
  const link = buildWhatsAppLink("Hello Som Bakers 👋 I have a question about your cakes.");

  const highlights = [
    { title: "Fresh daily", desc: "Baked fresh every day with quality ingredients.", icon: "🍰" },
    { title: "Custom orders", desc: "Birthdays, weddings, events — you name it.", icon: "🎉" },
    { title: "Fast WhatsApp", desc: "Order & confirm quickly through WhatsApp.", icon: "💬" },
    { title: "Delivery option", desc: "Choose your delivery date & preferred time.", icon: "🚚" },
  ];

  return (
    <div style={page}>
      {/* Hero */}
      <div style={hero}>
        <div style={badge}>SOM BAKERS</div>

        <h1 style={title}>Sweet moments, baked with love.</h1>
        <p style={subtitle}>
          We make fresh cakes daily for birthdays, weddings, and special events.
          Order quickly via WhatsApp and we’ll confirm your order.
        </p>

        <div style={actions}>
          <a href={link} target="_blank" rel="noreferrer" style={waBtn}>
            💚 Contact on WhatsApp
          </a>

          <a href="/cakes" style={secondaryBtn}>
            🍰 Browse Cakes
          </a>
        </div>

        <div style={heroStats}>
          <Stat label="Fresh" value="Daily" />
          <Divider />
          <Stat label="Orders" value="WhatsApp" />
          <Divider />
          <Stat label="Events" value="Custom" />
        </div>
      </div>

      {/* Highlights */}
      <div style={section}>
        <h2 style={sectionTitle}>Why customers love us</h2>
        <p style={sectionSub}>
          Simple ordering, beautiful designs, and delicious flavors — every time.
        </p>

        <div style={grid}>
          {highlights.map((h) => (
            <div key={h.title} style={card}>
              <div style={iconWrap}>{h.icon}</div>
              <div>
                <div style={cardTitle}>{h.title}</div>
                <div style={cardDesc}>{h.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Story / CTA */}
      <div style={ctaWrap}>
        <div style={cta}>
          <div>
            <h2 style={ctaTitle}>Have a custom request?</h2>
            <p style={ctaDesc}>
              Tell us the size, flavor, design idea, and your delivery date — we’ll reply fast.
            </p>
          </div>

          <a href={link} target="_blank" rel="noreferrer" style={ctaBtn}>
            Send a message →
          </a>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={stat}>
      <div style={statValue}>{value}</div>
      <div style={statLabel}>{label}</div>
    </div>
  );
}

function Divider() {
  return <div style={divider} />;
}

/* ---------------- styles ---------------- */

const page = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "22px 16px 40px",
};

const hero = {
  borderRadius: 24,
  padding: "28px 18px",
  background:
    "linear-gradient(135deg, rgba(91,23,66,0.10), rgba(255,169,91,0.14))",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
};

const badge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 900,
  letterSpacing: 1,
  fontSize: 12,
  color: "#5B1742",
  background: "rgba(91,23,66,0.10)",
  border: "1px solid rgba(91,23,66,0.18)",
  padding: "8px 12px",
  borderRadius: 999,
};

const title = {
  margin: "14px 0 8px",
  fontSize: 34,
  lineHeight: 1.15,
  fontWeight: 1000,
  color: "#111827",
};

const subtitle = {
  margin: 0,
  maxWidth: 720,
  color: "#4B5563",
  fontSize: 15,
  lineHeight: 1.6,
  fontWeight: 600,
};

const actions = {
  marginTop: 16,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const waBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  background: "#25D366",
  color: "white",
  padding: "12px 16px",
  borderRadius: 999,
  textDecoration: "none",
  fontWeight: 900,
  boxShadow: "0 10px 20px rgba(37, 211, 102, 0.25)",
};

const secondaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  background: "white",
  color: "#5B1742",
  padding: "12px 16px",
  borderRadius: 999,
  textDecoration: "none",
  fontWeight: 900,
  border: "1px solid rgba(91,23,66,0.18)",
};

const heroStats = {
  marginTop: 18,
  background: "rgba(255,255,255,0.75)",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 18,
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const stat = {
  minWidth: 100,
  textAlign: "center",
  flex: "1 1 120px",
};

const statValue = {
  fontWeight: 1000,
  color: "#111827",
  fontSize: 16,
};

const statLabel = {
  marginTop: 2,
  fontSize: 12,
  fontWeight: 800,
  color: "#6B7280",
};

const divider = {
  width: 1,
  height: 26,
  background: "rgba(0,0,0,0.08)",
};

const section = {
  marginTop: 22,
};

const sectionTitle = {
  margin: "0 0 6px",
  fontSize: 18,
  fontWeight: 1000,
  color: "#111827",
};

const sectionSub = {
  margin: 0,
  color: "#6B7280",
  fontSize: 13,
  fontWeight: 700,
};

const grid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
};

const card = {
  borderRadius: 18,
  background: "white",
  border: "1px solid rgba(0,0,0,0.06)",
  padding: 14,
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const iconWrap = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: "rgba(91,23,66,0.10)",
  border: "1px solid rgba(91,23,66,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  flexShrink: 0,
};

const cardTitle = {
  fontWeight: 1000,
  color: "#111827",
  fontSize: 14,
  marginTop: 2,
};

const cardDesc = {
  marginTop: 4,
  color: "#6B7280",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.45,
};

const ctaWrap = {
  marginTop: 18,
};

const cta = {
  borderRadius: 22,
  padding: 16,
  background: "linear-gradient(135deg, rgba(37,211,102,0.12), rgba(255,255,255,1))",
  border: "1px solid rgba(37, 211, 102, 0.20)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const ctaTitle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 1000,
  color: "#111827",
};

const ctaDesc = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: 13,
  fontWeight: 700,
  maxWidth: 620,
  lineHeight: 1.45,
};

const ctaBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 14px",
  borderRadius: 999,
  background: "#111827",
  color: "white",
  textDecoration: "none",
  fontWeight: 1000,
};
