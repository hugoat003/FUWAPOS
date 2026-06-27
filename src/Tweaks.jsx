/* FUWA POS — panel de personalización en vivo ("Tweaks").
   Variaciones visuales lado a lado sobre la app real: tema, tipografía,
   redondez, iconos y propina. Se guarda en el navegador. */
import { useState } from "react";

const panel = {
  position: "fixed",
  right: 18,
  bottom: 80,
  zIndex: 2000,
  width: 280,
  maxHeight: "calc(100vh - 110px)",
  overflowY: "auto",
  background: "#fff",
  border: "2px solid var(--line)",
  borderRadius: 18,
  boxShadow: "0 24px 60px -20px rgba(40,44,60,.45)",
  padding: "16px 18px 18px",
};
const sectionLabel = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "var(--muted)",
  margin: "16px 0 8px",
};
const rowLabel = { fontSize: 13.5, fontWeight: 800, color: "var(--ink)", marginBottom: 7 };

function Segmented({ value, options, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              flex: "1 1 auto",
              padding: "7px 10px",
              borderRadius: 999,
              border: "2px solid " + (active ? "var(--primary)" : "var(--line)"),
              background: active ? "var(--primary)" : "#fff",
              color: active ? "#fff" : "var(--ink)",
              fontFamily: "var(--ui)",
              fontWeight: 800,
              fontSize: 12.5,
              cursor: "pointer",
              transition: "all .12s ease",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      style={{
        position: "relative",
        width: 42,
        height: 24,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: value ? "var(--primary)" : "var(--line)",
        transition: "background .15s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.25)",
          transform: value ? "translateX(18px)" : "none",
          transition: "transform .15s ease",
        }}
      />
    </button>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "6px 0" }}>
      <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{label}</span>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export function Tweaks({ t, setTweak }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Personalizar apariencia"
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 2000,
          height: 48,
          padding: "0 20px",
          borderRadius: 999,
          border: "none",
          background: "var(--navy)",
          color: "#fff",
          fontFamily: "var(--ui)",
          fontWeight: 800,
          fontSize: 15,
          cursor: "pointer",
          boxShadow: "0 12px 30px -10px rgba(40,44,60,.5)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        ✦ Tweaks
      </button>

      {open && (
        <div style={panel} data-fuwa-tweaks="">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <b style={{ fontFamily: "var(--display)", fontSize: 16, color: "var(--navy)" }}>Tweaks</b>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              style={{ border: "none", background: "transparent", color: "var(--muted)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>

          <div style={sectionLabel}>Estilo visual</div>
          <div style={rowLabel}>Tema</div>
          <Segmented value={t.theme} options={["Mochi", "Matcha", "Sakura", "Hojicha"]} onChange={(v) => setTweak("theme", v)} />

          <div style={{ ...rowLabel, marginTop: 14 }}>Tipografía</div>
          <Segmented value={t.display} options={["Baloo 2", "Fredoka", "Quicksand"]} onChange={(v) => setTweak("display", v)} />

          <div style={{ ...rowLabel, marginTop: 14, display: "flex", justifyContent: "space-between" }}>
            <span>Redondez</span>
            <span style={{ color: "var(--muted)", fontWeight: 700 }}>{t.radius}px</span>
          </div>
          <input
            type="range"
            min={6}
            max={28}
            step={1}
            value={t.radius}
            onChange={(e) => setTweak("radius", Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--primary)" }}
          />

          <div style={sectionLabel}>Operación</div>
          <ToggleRow label="Iconos en productos" value={t.showEmoji} onChange={(v) => setTweak("showEmoji", v)} />
          <ToggleRow label="Sugerir propina" value={t.tipEnabled} onChange={(v) => setTweak("tipEnabled", v)} />

          <div style={sectionLabel}>Impresora</div>
          <div style={rowLabel}>Papel del recibo / comanda</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { v: "80", l: "80mm" },
              { v: "58", l: "58mm" },
              { v: "carta", l: "Carta" },
            ].map((o) => {
              const active = (t.paper || "80") === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setTweak("paper", o.v)}
                  style={{ flex: "1 1 auto", padding: "7px 10px", borderRadius: 999, border: "2px solid " + (active ? "var(--primary)" : "var(--line)"), background: active ? "var(--primary)" : "#fff", color: active ? "#fff" : "var(--ink)", fontFamily: "var(--ui)", fontWeight: 800, fontSize: 12.5, cursor: "pointer", transition: "all .12s ease" }}
                >
                  {o.l}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 7, lineHeight: 1.4 }}>80mm y 58mm son para impresora térmica de rollo; Carta para una impresora normal.</div>
        </div>
      )}
    </>
  );
}
