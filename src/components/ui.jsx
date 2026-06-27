/* FUWA POS — átomos de UI: botón y chip/pill. */
import { Icon } from "./Icon.jsx";

export function Btn({ children, kind = "primary", size = "md", icon, onClick, disabled, style, full }) {
  const pads = { sm: "8px 14px", md: "12px 20px", lg: "16px 26px" };
  const fonts = { sm: 14, md: 16, lg: 19 };
  const kinds = {
    primary: { background: "var(--primary)", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "var(--navy)", border: "2px solid var(--line)" },
    soft: { background: "var(--primary-soft)", color: "var(--primary)", border: "none" },
    danger: { background: "transparent", color: "oklch(0.55 0.16 25)", border: "2px solid oklch(0.85 0.07 25)" },
    dark: { background: "var(--navy)", color: "#fff", border: "none" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...kinds[kind],
        padding: pads[size],
        fontSize: fonts[size],
        fontWeight: 800,
        fontFamily: "var(--ui)",
        borderRadius: "calc(var(--r) * 0.7)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        width: full ? "100%" : "auto",
        transition: "transform .08s ease, filter .15s ease",
        ...style,
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {icon && <Icon name={icon} size={fonts[size] + 2} />}
      {children}
    </button>
  );
}

export function Pill({ children, active, color, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 15,
        fontFamily: "var(--ui)",
        cursor: "pointer",
        border: "2px solid " + (active ? "transparent" : "var(--line)"),
        background: active ? color || "var(--navy)" : "#fff",
        color: active ? "#fff" : "var(--ink)",
        transition: "all .12s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Estilos compartidos para modales / hojas (order modal, menu editor form).
export const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(40,44,60,.45)",
  backdropFilter: "blur(3px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 20,
};
export const sheet = {
  background: "var(--cream)",
  borderRadius: "calc(var(--r) * 1.2)",
  width: "100%",
  overflow: "hidden",
  boxShadow: "0 30px 70px -20px rgba(40,44,60,.5)",
};
export const iconBtn = {
  width: 38,
  height: 38,
  borderRadius: 999,
  border: "none",
  background: "rgba(255,255,255,.6)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--navy)",
};
export const qtyBtn = {
  width: 34,
  height: 34,
  borderRadius: 999,
  border: "none",
  background: "var(--cream)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--navy)",
};
