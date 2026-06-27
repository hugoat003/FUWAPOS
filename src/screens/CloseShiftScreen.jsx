/* FUWA POS — cierre de caja: arqueo de efectivo, disponible para cualquier rol con turno abierto. */
import { useState } from "react";
import { Btn } from "../components/ui.jsx";
import { money, cashFromOrders } from "../lib/format.js";

function Row({ label, value, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0", color: strong ? "var(--navy)" : "var(--muted)" }}>
      <span style={{ fontWeight: strong ? 800 : 400 }}>{label}</span>
      <span style={{ fontWeight: 800, color: "var(--ink)" }}>{value}</span>
    </div>
  );
}

export function CloseShiftScreen({ shiftOpen, openingCash, orders, expenses, onCloseShift }) {
  const [counted, setCounted] = useState("");

  if (!shiftOpen) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
        <div style={{ color: "var(--muted)", fontSize: 16, maxWidth: 360 }}>No hay un turno abierto para cerrar. Abre la caja desde Orden para empezar a cobrar.</div>
      </div>
    );
  }

  const validOrders = orders.filter((o) => !o.voided);
  const cashSales = cashFromOrders(orders);
  const cashExpenses = expenses.filter((e) => e.method === "efectivo").reduce((s, e) => s + e.amount, 0);
  const expected = openingCash + cashSales - cashExpenses;
  const diff = (parseFloat(counted) || 0) - expected;
  const ok = Math.abs(diff) < 0.01;

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 28, color: "var(--navy)", margin: "0 0 4px" }}>Cierre de caja</h1>
        <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 15 }}>{validOrders.length} órdenes cobradas en este turno. Cuenta el efectivo de la caja antes de cerrar.</p>

        <div style={{ background: "#fff", border: "2px solid var(--line)", borderRadius: "var(--r)", padding: "20px 22px" }}>
          <Row label="Fondo de apertura" value={money(openingCash)} />
          <Row label="+ Ventas en efectivo" value={money(cashSales)} />
          {cashExpenses > 0 && <Row label="− Gastos en efectivo" value={money(cashExpenses)} />}
          <div style={{ borderTop: "1.5px dashed var(--line)", marginTop: 6, paddingTop: 8 }}>
            <Row label="Efectivo esperado" value={money(expected)} strong />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Efectivo contado en caja</div>
            <input
              value={counted}
              onChange={(e) => setCounted(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="Q0.00"
              autoFocus
              style={{ width: "100%", padding: "13px 16px", border: "2px solid var(--line)", borderRadius: 14, fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: "var(--navy)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {counted !== "" && (
            <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 14, background: ok ? "var(--primary-soft)" : "oklch(0.94 0.05 25)", display: "flex", justifyContent: "space-between", fontWeight: 800, color: ok ? "var(--primary)" : "oklch(0.5 0.16 25)" }}>
              <span>{ok ? "Caja cuadrada ✓" : diff > 0 ? "Sobrante" : "Faltante"}</span>
              <span>{money(Math.abs(diff))}</span>
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <Btn kind="dark" size="lg" full icon="check" disabled={counted === ""} onClick={() => onCloseShift(parseFloat(counted) || 0)}>
              Cerrar caja
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
