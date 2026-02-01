export function buildWhatsAppLink(message) {
  const phone = import.meta.env.VITE_WHATSAPP_NUMBER; // from Vercel
  const text = encodeURIComponent(message);

  if (!phone) {
    // fallback: open without number
    return `https://wa.me/?text=${text}`;
  }

  return `https://wa.me/${phone}?text=${text}`;
}
