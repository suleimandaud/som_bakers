import { buildWhatsAppLink } from "../lib/whatsapp.js";

export default function WhatsAppFloat() {
  const link = buildWhatsAppLink("Hello, I'd like to order a cake. Please share today's available options.");

  return (
    <a href={link} target="_blank" rel="noreferrer" style={styles.btn} aria-label="WhatsApp">
      WhatsApp
    </a>
  );
}

const styles = {
  btn: {
    position: "fixed",
    right: 16,
    bottom: 16,
    background: "#25D366",
    color: "white",
    padding: "12px 16px",
    borderRadius: 999,
    textDecoration: "none",
    fontWeight: 700,
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
  },
};
