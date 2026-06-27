/* FUWA POS — herramientas de mantenimiento y respaldo (solo Gerencia). */
import { useRef } from "react";
import { Icon } from "../components/Icon.jsx";
import { Btn } from "../components/ui.jsx";

function ToolCard({ icon, title, desc, danger, children }) {
  return (
    <div style={{ background: "#fff", border: "2px solid " + (danger ? "oklch(0.85 0.07 25)" : "var(--line)"), borderRadius: "var(--r)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: danger ? "oklch(0.94 0.05 25)" : "var(--primary-soft)", color: danger ? "oklch(0.5 0.16 25)" : "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={icon} size={19} />
        </div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 16.5, color: "var(--navy)" }}>{title}</div>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</p>
      {children}
    </div>
  );
}

function backupLabel(ts) {
  if (!ts) return "Nunca se ha respaldado. Descarga uno hoy para no arriesgar los datos.";
  const days = Math.floor((Date.now() - ts) / 86400000);
  const when = new Date(ts).toLocaleString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const ago = days <= 0 ? "hoy" : days === 1 ? "hace 1 día" : `hace ${days} días`;
  return `Último respaldo: ${when} (${ago}).`;
}

export function ToolsScreen({ onResetMenu, onClearOrders, onExport, onImport, lastBackup }) {
  const fileInputRef = useRef(null);
  const stale = !lastBackup || (Date.now() - lastBackup) / 86400000 >= 2;

  function handleImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (file) onImport(file);
    e.target.value = "";
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "22px 32px 40px" }}>
      <h1 style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 28, color: "var(--navy)", margin: "0 0 4px" }}>Herramientas</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 15 }}>Acciones de mantenimiento y respaldo de datos. Visible solo para Gerencia.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, maxWidth: 920 }}>
        <ToolCard icon="cash" title="Respaldo de datos" desc="Descarga un archivo .json con el menú, empleados, historial y turnos archivados. Hazlo al cerrar cada día y guárdalo fuera de esta computadora.">
          <div style={{ fontSize: 12.5, fontWeight: 800, color: stale ? "oklch(0.5 0.13 70)" : "var(--primary)", background: stale ? "oklch(0.95 0.06 85)" : "var(--primary-soft)", borderRadius: 10, padding: "8px 12px" }}>
            {backupLabel(lastBackup)}
          </div>
          <Btn kind="primary" size="sm" icon="check" onClick={onExport}>
            Exportar respaldo (.json)
          </Btn>
        </ToolCard>

        <ToolCard icon="tools" title="Restaurar respaldo" desc="Carga un archivo .json exportado previamente. Reemplaza el menú, empleados, historial y configuración actuales — úsalo solo para recuperar datos." danger>
          <Btn kind="danger" size="sm" icon="check" onClick={() => fileInputRef.current.click()}>
            Importar respaldo
          </Btn>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} style={{ display: "none" }} />
        </ToolCard>

        <ToolCard icon="edit" title="Reiniciar menú" desc="Restaura los productos, opciones y categorías originales de FUWA, descartando los cambios hechos en el Editor de menú." danger>
          <Btn kind="danger" size="sm" icon="check" onClick={onResetMenu}>
            Reiniciar menú
          </Btn>
        </ToolCard>

        <ToolCard icon="trash" title="Borrar órdenes del turno" desc="Elimina las órdenes del turno actual sin archivarlas. Úsalo solo para limpiar datos de prueba, no en operación real." danger>
          <Btn kind="danger" size="sm" icon="trash" onClick={onClearOrders}>
            Borrar órdenes del día
          </Btn>
        </ToolCard>
      </div>
    </div>
  );
}
