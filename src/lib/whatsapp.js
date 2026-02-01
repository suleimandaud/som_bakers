export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

export function buildWhatsAppLink(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function buildCartMessage({ customer, items, total }) {
  const lines = [];

  lines.push("Hello, I want to order cakes:");
  lines.push("");
  lines.push(`Name: ${customer.name}`);
  lines.push(`Phone: ${customer.phone}`);

  if (customer.address) lines.push(`Address: ${customer.address}`);
  lines.push("");

  lines.push("Items:");
  items.forEach((it) => {
    lines.push(`- ${it.name} x${it.qty} = $${(it.price * it.qty).toFixed(2)}`);
  });

  lines.push("");
  lines.push(`Total: $${total.toFixed(2)}`);

  if (customer.notes) {
    lines.push("");
    lines.push(`Notes: ${customer.notes}`);
  }

  return lines.join("\n");
}

export function buildSingleCakeMessage(cake) {
  return [
    "Hello, I want to order this cake:",
    "",
    `Cake: ${cake.name}`,
    `Price: $${Number(cake.price).toFixed(2)}`,
    "Qty: 1",
  ].join("\n");
}
