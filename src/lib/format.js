/* FUWA POS — helpers de formato y cálculo de líneas del carrito. */

// Moneda (Quetzal)
export function money(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return "Q" + v.toFixed(2);
}

// Hora corta para la gráfica del dashboard (8 -> "8a", 15 -> "3p")
export function fmtHour(h) {
  h = +h;
  const ap = h >= 12 ? "p" : "a";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return hr + ap;
}

// Precio unitario de una línea ya configurada (base + tamaño + modificadores)
export function lineUnit(line) {
  let p = line.basePrice;
  if (line.size) p += line.size.delta;
  (line.mods || []).forEach((m) => (p += m.delta));
  return p;
}

export function lineTotal(line) {
  return lineUnit(line) * line.qty;
}

// Suma el efectivo cobrado en órdenes válidas (no anuladas), incluyendo la
// parte en efectivo de los pagos divididos.
export function cashFromOrders(orders) {
  return orders
    .filter((o) => !o.voided)
    .reduce((s, o) => {
      const parts = o.payment.split ? o.payment.parts : [{ method: o.payment.method, total: o.payment.total }];
      return s + parts.filter((p) => p.method === "efectivo").reduce((s2, p) => s2 + p.total, 0);
    }, 0);
}
