import { buildWhatsAppLink } from "../lib/whatsapp.js";

export default function About() {
  const link = buildWhatsAppLink("Hello, I have a question about your cakes.");

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>About Us</h1>
      <p>
        We make fresh cakes daily for birthdays, weddings, and events.
        Order quickly via WhatsApp and we’ll confirm your order.
      </p>

      <a href={link} target="_blank" rel="noreferrer" style={btn}>
        Contact on WhatsApp
      </a>
    </div>
  );
}

const btn = {
  display: "inline-block",
  marginTop: 12,
  background: "#25D366",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  textDecoration: "none",
  fontWeight: 800,
};
