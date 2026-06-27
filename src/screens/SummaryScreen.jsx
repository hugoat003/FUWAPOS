/* FUWA POS — dashboard de ventas: turno actual o rango de fechas + comparativa de turnos. */
import { useMemo, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Mascot } from "../components/Mascot.jsx";
import { money, fmtHour, lineTotal } from "../lib/format.js";

// Períodos disponibles para el reporte.
const PERIODS = [
  { id: "turno", label: "Turno actual" },
  { id: "hoy", label: "Hoy" },
  { id: "7dias", label: "7 días" },
  { id: "todo", label: "Todo" },
];

// Inicio (ms) del rango según el período; null = sin límite inferior.
function periodStart(id) {
  const d = new Date();
  if (id === "hoy") {
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (id === "7dias") {
    d.setHours(0, 0, 0, 0);
    return d.getTime() - 6 * 86400000;
  }
  return null;
}

function Kpi({ icon, label, value, accent }) {
  return (
    <div style={{ background: accent ? "var(--navy)" : "#fff", border: "2px solid " + (accent ? "var(--navy)" : "var(--line)"), borderRadius: "var(--r)", padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: accent ? "rgba(255,255,255,.14)" : "var(--primary-soft)", color: accent ? "#fff" : "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={18} />
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: accent ? "rgba(255,255,255,.72)" : "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 1.1 }}>{label}</div>
      </div>
      <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 27, color: accent ? "#fff" : "var(--navy)" }}>{value}</div>
    </div>
  );
}

function DashCard({ title, hint, children }) {
  return (
    <div style={{ background: "#fff", border: "2px solid var(--line)", borderRadius: "var(--r)", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 17, color: "var(--navy)" }}>{title}</div>
        {hint && <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--gold)", background: "color-mix(in oklch, var(--gold) 14%, white)", padding: "3px 10px", borderRadius: 999 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Donut({ frac }) {
  const R = 46,
    sw = 20,
    C = 2 * Math.PI * R,
    size = 128;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--gold)" strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={sw}
          strokeDasharray={`${frac * C} ${C}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray .5s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 24, color: "var(--navy)" }}>{Math.round(frac * 100)}%</div>
        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginTop: 3 }}>efectivo</div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 12, height: 12, borderRadius: 4, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--ink)" }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>{sub}</div>
      </div>
      <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 16, color: "var(--navy)" }}>{value}</div>
    </div>
  );
}

function PeriodSelector({ period, setPeriod }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {PERIODS.map((p) => {
        const active = period === p.id;
        return (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{ padding: "8px 16px", borderRadius: 999, fontFamily: "var(--ui)", fontWeight: 800, fontSize: 13.5, cursor: "pointer", border: "2px solid " + (active ? "var(--primary)" : "var(--line)"), background: active ? "var(--primary)" : "#fff", color: active ? "#fff" : "var(--ink)", transition: "all .12s ease" }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

export function SummaryScreen({ orders, expenses = [], cats, shiftHistory = [] }) {
  const [period, setPeriod] = useState("turno");
  const catById = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c])), [cats]);

  // Para "Turno actual" solo cuenta el turno en curso; para los demás períodos
  // se suman las órdenes y gastos de los turnos archivados dentro del rango.
  const { periodOrders, periodExpenses } = useMemo(() => {
    if (period === "turno") return { periodOrders: orders, periodExpenses: expenses };
    const allOrders = [...orders, ...shiftHistory.flatMap((s) => s.orders || [])];
    const allExpenses = [...expenses, ...shiftHistory.flatMap((s) => s.expenses || [])];
    const start = periodStart(period);
    if (start == null) return { periodOrders: allOrders, periodExpenses: allExpenses };
    return {
      periodOrders: allOrders.filter((o) => o.ts >= start),
      periodExpenses: allExpenses.filter((e) => e.ts >= start),
    };
  }, [period, orders, expenses, shiftHistory]);

  // Comparativa de turnos: turno actual (si hay) + turnos archivados recientes.
  const shiftRows = useMemo(() => {
    const summarize = (valid) => {
      const total = valid.reduce((s, o) => s + o.payment.total, 0);
      return { count: valid.length, total, avg: valid.length ? total / valid.length : 0 };
    };
    const rows = [...shiftHistory]
      .reverse()
      .slice(0, 8)
      .map((s) => ({ id: s.id, label: s.closedAtLabel, diff: s.diff, ...summarize(s.orders.filter((o) => !o.voided)) }));
    const cur = orders.filter((o) => !o.voided);
    if (cur.length) rows.unshift({ id: "actual", label: "Turno actual", diff: null, ...summarize(cur) });
    return rows;
  }, [orders, shiftHistory]);

  const expensesTotal = periodExpenses.reduce((s, e) => s + e.amount, 0);

  const stats = useMemo(() => {
    const validOrders = periodOrders.filter((o) => !o.voided);
    let sales = 0,
      tips = 0,
      cash = 0,
      card = 0,
      cashN = 0,
      cardN = 0,
      items = 0;
    const byCat = {};
    cats.forEach((c) => (byCat[c.id] = 0));
    const byHour = {};
    for (let h = 8; h <= 20; h++) byHour[h] = 0;
    const prodMap = {};
    const cashierMap = {};
    validOrders.forEach((o) => {
      sales += o.payment.subtotal;
      tips += o.payment.tip || 0;
      // El pago dividido reparte el total entre varios métodos (parts[]).
      const parts = o.payment.split ? o.payment.parts : [{ method: o.payment.method, total: o.payment.total }];
      parts.forEach((p) => {
        if (p.method === "efectivo") {
          cash += p.total;
          cashN++;
        } else {
          card += p.total;
          cardN++;
        }
      });
      const h = Math.min(20, Math.max(8, new Date(o.ts).getHours()));
      byHour[h] += o.payment.total;
      const cashierName = o.cashier || "Barista";
      if (!cashierMap[cashierName]) cashierMap[cashierName] = { name: cashierName, sales: 0, count: 0 };
      cashierMap[cashierName].sales += o.payment.total;
      cashierMap[cashierName].count++;
      o.lines.forEach((l) => {
        const lt = lineTotal(l);
        byCat[l.catId] = (byCat[l.catId] || 0) + lt;
        items += l.qty;
        if (!prodMap[l.name]) prodMap[l.name] = { name: l.name, qty: 0, rev: 0, catId: l.catId };
        prodMap[l.name].qty += l.qty;
        prodMap[l.name].rev += lt;
      });
    });
    const total = validOrders.reduce((s, o) => s + o.payment.total, 0);
    const top = Object.values(prodMap)
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);
    const byCashier = Object.values(cashierMap).sort((a, b) => b.sales - a.sales);
    return { sales, tips, cash, card, cashN, cardN, byCat, byHour, total, count: validOrders.length, avg: validOrders.length ? total / validOrders.length : 0, items, top, byCashier };
  }, [periodOrders, cats]);

  const periodLabel = PERIODS.find((p) => p.id === period).label;

  // ---- estado vacío ----
  if (stats.count === 0 && periodExpenses.length === 0) {
    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "22px 32px 40px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 28, color: "var(--navy)", margin: 0 }}>Resumen</h1>
          <PeriodSelector period={period} setPeriod={setPeriod} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
          <Mascot size={84} color="var(--line)" />
          <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 26, color: "var(--navy)" }}>No hay ventas en este período</div>
          <div style={{ color: "var(--muted)", fontSize: 15.5, maxWidth: 380, lineHeight: 1.5 }}>{period === "turno" ? "Cobra órdenes desde la pantalla principal y aquí verás el resumen del turno en tiempo real." : "Prueba con otro período o revisa los turnos archivados en Historial."}</div>
        </div>
      </div>
    );
  }

  const maxHour = Math.max(1, ...Object.values(stats.byHour));
  const peakHour = Object.entries(stats.byHour).sort((a, b) => b[1] - a[1])[0][0];
  const maxCat = Math.max(1, ...Object.values(stats.byCat));
  const cashFrac = stats.total ? stats.cash / stats.total : 0;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "22px 32px 40px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 28, color: "var(--navy)", margin: "0 0 4px" }}>{period === "turno" ? "Resumen del turno" : `Resumen · ${periodLabel}`}</h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: 15, textTransform: "capitalize" }}>{new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <PeriodSelector period={period} setPeriod={setPeriod} />
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))", gap: 16, marginBottom: 18 }}>
        <Kpi icon="cash" label="Ventas totales" value={money(stats.total)} accent />
        <Kpi icon="order" label="Órdenes" value={stats.count} />
        <Kpi icon="bag" label="Productos vendidos" value={stats.items} />
        <Kpi icon="star" label="Ticket promedio" value={money(stats.avg)} />
        <Kpi icon="note" label="Propinas" value={money(stats.tips)} />
        <Kpi icon="trash" label="Gastos del turno" value={money(expensesTotal)} />
      </div>

      {/* cuerpo */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, alignItems: "start" }}>
        {/* columna izquierda */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <DashCard title="Ventas por hora" hint={`Hora pico: ${fmtHour(peakHour)}`}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "2.2%", height: 170, paddingTop: 10 }}>
              {Object.entries(stats.byHour).map(([h, v]) => {
                const pk = h === peakHour && v > 0;
                return (
                  <div key={h} title={`${fmtHour(h)} · ${money(v)}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: pk ? "var(--gold)" : "transparent", height: 12 }}>{v > 0 ? Math.round(v) : ""}</div>
                    <div style={{ width: "100%", maxWidth: 30, height: Math.max(v > 0 ? 6 : 2, (v / maxHour) * 120), borderRadius: 8, background: pk ? "var(--gold)" : v > 0 ? "var(--primary)" : "var(--line)", transition: "height .4s ease" }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{fmtHour(h)}</div>
                  </div>
                );
              })}
            </div>
          </DashCard>

          <DashCard title="Top productos">
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
              {stats.top.map((p, i) => {
                const c = catById[p.catId];
                return (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: i === 0 ? "var(--gold)" : "var(--cream)", color: i === 0 ? "#fff" : "var(--muted)", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: c.tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{c.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ height: 6, background: "var(--cream)", borderRadius: 999, marginTop: 5, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: (p.rev / stats.top[0].rev) * 100 + "%", background: c.ink, borderRadius: 999 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 15.5, color: "var(--navy)" }}>{money(p.rev)}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>{p.qty} vendidos</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashCard>
        </div>

        {/* columna derecha */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <DashCard title="Métodos de pago">
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 4 }}>
              <Donut frac={cashFrac} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <LegendRow color="var(--primary)" label="Efectivo" value={money(stats.cash)} sub={stats.cashN + " órdenes"} />
                <LegendRow color="var(--gold)" label="Tarjeta" value={money(stats.card)} sub={stats.cardN + " órdenes"} />
              </div>
            </div>
          </DashCard>

          <DashCard title="Ventas por categoría">
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
              {cats.map((c) => {
                const v = stats.byCat[c.id] || 0;
                return (
                  <div key={c.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
                      <span style={{ fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap" }}>
                        {c.icon} {c.name}
                      </span>
                      <span style={{ fontWeight: 800, color: "var(--navy)" }}>{money(v)}</span>
                    </div>
                    <div style={{ height: 10, background: "var(--cream)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: (v / maxCat) * 100 + "%", background: c.ink, borderRadius: 999, transition: "width .4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </DashCard>

          <DashCard title="Ventas por cajero">
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
              {stats.byCashier.map((c) => (
                <LegendRow key={c.name} color="var(--primary)" label={c.name} value={money(c.sales)} sub={c.count + " órdenes"} />
              ))}
            </div>
          </DashCard>

          {shiftRows.length > 0 && (
            <DashCard title="Comparativa de turnos" hint={`${shiftRows.length} turnos`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                {(() => {
                  const maxTotal = Math.max(1, ...shiftRows.map((r) => r.total));
                  return shiftRows.map((r) => {
                    const cuadrada = r.diff === null || Math.abs(r.diff) < 0.01;
                    return (
                      <div key={r.id} style={{ padding: "8px 0", borderBottom: "1px dashed var(--line)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
                          <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 15.5, color: "var(--navy)" }}>{money(r.total)}</span>
                        </div>
                        <div style={{ height: 6, background: "var(--cream)", borderRadius: 999, margin: "5px 0", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: (r.total / maxTotal) * 100 + "%", background: "var(--primary)", borderRadius: 999 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>
                          <span>{r.count} órdenes · prom. {money(r.avg)}</span>
                          {r.diff === null ? <span>en curso</span> : <span style={{ color: cuadrada ? "var(--primary)" : "oklch(0.55 0.16 25)" }}>{cuadrada ? "cuadrada" : r.diff > 0 ? `sobrante ${money(r.diff)}` : `faltante ${money(-r.diff)}`}</span>}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </DashCard>
          )}
        </div>
      </div>
    </div>
  );
}
