/* FUWA POS — pantalla de orden: menú con búsqueda, carrito en vivo y modal. */
import { useMemo, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Mascot } from "../components/Mascot.jsx";
import { Btn, Pill, qtyBtn } from "../components/ui.jsx";
import { money, lineTotal } from "../lib/format.js";
import { CustomizeModal } from "./CustomizeModal.jsx";

// ---------- Tarjeta de producto ----------
function ProductCard({ product, cat, showEmoji, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: "left",
        background: "#fff",
        border: "2px solid var(--line)",
        borderRadius: "var(--r)",
        padding: 0,
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? "0 12px 26px -12px rgba(58,65,88,.35)" : "0 2px 0 rgba(58,65,88,.04)",
        borderColor: hover ? cat.ink : "var(--line)",
      }}
    >
      <div style={{ height: 78, background: cat.tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, position: "relative", overflow: "hidden" }}>
        {product.image ? (
          <img src={product.image} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : showEmoji ? (
          product.icon || cat.icon
        ) : (
          <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 26, color: cat.ink, opacity: 0.9 }}>
            {product.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 16.5, color: "var(--ink)", lineHeight: 1.15 }}>{product.name}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.3, flex: 1 }}>{product.desc}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: "var(--navy)", fontFamily: "var(--display)" }}>{money(product.price)}</span>
          {(product.sizes || (product.mods && product.mods.length > 0)) && (
            <span style={{ fontSize: 11, fontWeight: 800, color: cat.ink, background: cat.tint, padding: "3px 9px", borderRadius: 999 }}>opciones</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ---------- Línea del carrito ----------
function CartLine({ line, cat, onQty, onRemove, onEdit }) {
  const subtitle = [line.size && line.size.name, ...(line.mods || []).filter((m) => m.group !== "azucar" || m.name !== "100%").map((m) => m.name)]
    .filter(Boolean)
    .join(" · ");
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1.5px dashed var(--line)" }}>
      <div style={{ width: 6, alignSelf: "stretch", borderRadius: 4, background: cat ? cat.ink : "var(--gold)", opacity: 0.55, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 15.5, color: "var(--ink)" }}>{line.name}</span>
          <span style={{ fontWeight: 800, fontSize: 15.5, color: "var(--navy)" }}>{money(lineTotal(line))}</span>
        </div>
        {subtitle && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{subtitle}</div>}
        {line.note && <div style={{ fontSize: 12.5, color: cat ? cat.ink : "var(--gold)", marginTop: 3, fontStyle: "italic" }}>“{line.note}”</div>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2, border: "2px solid var(--line)", borderRadius: 999, padding: 2 }}>
            <button onClick={() => onQty(line.qty - 1)} style={{ ...qtyBtn, width: 28, height: 28 }}>
              <Icon name="minus" size={15} />
            </button>
            <span style={{ width: 26, textAlign: "center", fontWeight: 800, fontSize: 15 }}>{line.qty}</span>
            <button onClick={() => onQty(line.qty + 1)} style={{ ...qtyBtn, width: 28, height: 28 }}>
              <Icon name="plus" size={15} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 4 }}>
              <Icon name="edit" size={16} />
            </button>
            <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 4 }}>
              <Icon name="trash" size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Pantalla de Orden ----------
export function OrderScreen({ cart, menu, mods, cats, addLine, setLineQty, updateLine, removeLine, clearCart, onCheckout, orderType, setOrderType, showEmoji }) {
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const catById = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c])), [cats]);

  const filtered = menu.filter((p) => {
    if (activeCat !== "all" && p.cat !== activeCat) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  function pick(product) {
    const cat = catById[product.cat];
    const hasOpts = product.sizes || (product.mods && product.mods.length > 0);
    if (hasOpts) {
      setModal({ product, cat });
      return;
    }
    addLine({
      uid: "L" + Date.now() + Math.random().toString(36).slice(2, 6),
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      size: null,
      mods: [],
      note: "",
      qty: 1,
      catId: product.cat,
    });
  }

  function editLine(line) {
    const product = menu.find((p) => p.id === line.productId);
    if (!product) return;
    setModal({ product, cat: catById[product.cat], editLine: line });
  }

  const subtotal = cart.reduce((s, l) => s + lineTotal(l), 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", height: "100%", minHeight: 0 }}>
      {/* ---- Menú ---- */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0, borderRight: "2px solid var(--line)" }}>
        <div style={{ padding: "20px 26px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <h1 style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 26, color: "var(--navy)", margin: 0 }}>Tomar orden</h1>
            <div style={{ position: "relative", width: 260 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
                <Icon name="search" size={18} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto…"
                style={{ width: "100%", padding: "10px 14px 10px 38px", border: "2px solid var(--line)", borderRadius: 999, fontFamily: "var(--ui)", fontSize: 14.5, outline: "none", color: "var(--ink)", background: "#fff" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <Pill active={activeCat === "all"} onClick={() => setActiveCat("all")}>
              Todo
            </Pill>
            {cats.map((c) => (
              <Pill key={c.id} active={activeCat === c.id} color={c.ink} onClick={() => setActiveCat(c.id)}>
                <span style={{ marginRight: 6 }}>{c.icon}</span>
                {c.name}
              </Pill>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 26px 26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 16 }}>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} cat={catById[p.cat]} showEmoji={showEmoji} onClick={() => pick(p)} />
            ))}
          </div>
          {filtered.length === 0 && <div style={{ textAlign: "center", color: "var(--muted)", padding: 50, fontSize: 16 }}>Sin resultados</div>}
        </div>
      </div>

      {/* ---- Carrito / Ticket ---- */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0, background: "#fff" }}>
        <div style={{ padding: "20px 22px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 20, color: "var(--navy)", display: "flex", alignItems: "center", gap: 9 }}>
              <Icon name="bag" size={22} /> Orden{" "}
              {count > 0 && <span style={{ fontSize: 13, background: "var(--primary-soft)", color: "var(--primary)", padding: "2px 10px", borderRadius: 999 }}>{count}</span>}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontWeight: 800, fontSize: 13.5, fontFamily: "var(--ui)" }}>
                Vaciar
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, background: "var(--cream)", padding: 5, borderRadius: 999 }}>
            {["Aquí", "Para llevar"].map((o) => (
              <button
                key={o}
                onClick={() => setOrderType(o)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 14,
                  fontFamily: "var(--ui)",
                  background: orderType === o ? "#fff" : "transparent",
                  color: orderType === o ? "var(--navy)" : "var(--muted)",
                  boxShadow: orderType === o ? "0 2px 6px rgba(58,65,88,.12)" : "none",
                  transition: "all .12s ease",
                }}
              >
                {o === "Aquí" ? "🍽️ Para aquí" : "🥡 Para llevar"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 22px" }}>
          {cart.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)", gap: 12, textAlign: "center", padding: 20 }}>
              <Mascot size={64} color="var(--line)" />
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>Aún no hay productos</div>
              <div style={{ fontSize: 13.5, maxWidth: 220, lineHeight: 1.5 }}>Toca un producto del menú para empezar la orden.</div>
            </div>
          ) : (
            cart.map((l) => <CartLine key={l.uid} line={l} cat={catById[l.catId]} onQty={(q) => setLineQty(l.uid, q)} onRemove={() => removeLine(l.uid)} onEdit={() => editLine(l)} />)
          )}
        </div>

        <div style={{ borderTop: "2px solid var(--line)", padding: "18px 22px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--muted)" }}>Total a pagar</span>
            <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 26, color: "var(--navy)" }}>{money(subtotal)}</span>
          </div>
          <Btn kind="primary" size="lg" full disabled={cart.length === 0} onClick={onCheckout} icon="card">
            Cobrar {count > 0 ? "· " + money(subtotal) : ""}
          </Btn>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 10 }}>El cliente paga antes de consumir · precios con impuestos incluidos</div>
        </div>
      </div>

      {modal && (
        <CustomizeModal
          product={modal.product}
          cat={modal.cat}
          modGroupsMap={mods}
          initialLine={modal.editLine}
          onClose={() => setModal(null)}
          onAdd={(line) => {
            if (modal.editLine) updateLine(modal.editLine.uid, line);
            else addLine(line);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
