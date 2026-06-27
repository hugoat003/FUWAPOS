/* FUWA POS — app principal: login, navegación por rol, estado, persistencia y tweaks. */
import { useEffect, useState } from "react";
import { Icon } from "./components/Icon.jsx";
import { Logo, Mascot } from "./components/Mascot.jsx";
import { Login } from "./auth/Login.jsx";
import { DEFAULT_USERS, ROLES } from "./auth/users.js";
import { Avatar } from "./auth/Avatar.jsx";
import { OrderScreen } from "./screens/OrderScreen.jsx";
import { PayScreen } from "./screens/PayScreen.jsx";
import { Receipt, PrintDocs, printDoc } from "./screens/Receipt.jsx";
import { MenuEditor } from "./screens/MenuEditor.jsx";
import { HistoryScreen } from "./screens/HistoryScreen.jsx";
import { SummaryScreen } from "./screens/SummaryScreen.jsx";
import { StaffEditor } from "./screens/StaffEditor.jsx";
import { OpenRegister } from "./screens/OpenRegister.jsx";
import { ToolsScreen } from "./screens/ToolsScreen.jsx";
import { ExpensesScreen } from "./screens/ExpensesScreen.jsx";
import { CloseShiftScreen } from "./screens/CloseShiftScreen.jsx";
import { Tweaks } from "./Tweaks.jsx";
import { usePersistentState } from "./lib/storage.js";
import { cashFromOrders } from "./lib/format.js";
import { PRODUCTS, MOD_GROUPS, CATEGORIES } from "./data.js";

const TWEAK_DEFAULTS = {
  theme: "Mochi",
  display: "Baloo 2",
  radius: 18,
  showEmoji: true,
  tipEnabled: true,
  paper: "80", // ancho de papel para imprimir: "80"mm / "58"mm térmica / "carta"
};

// Tamaño de página por tipo de papel (impresora térmica de rollo o carta).
const PAPER_PAGE = { "80": "80mm auto", "58": "58mm auto", carta: "auto" };

// Días sin respaldar tras los que se avisa del riesgo de pérdida de datos.
const BACKUP_STALE_DAYS = 2;
const daysSince = (ts) => (ts ? (Date.now() - ts) / 86400000 : Infinity);

const THEMES = {
  Mochi: { primary: "#3a4158", soft: "#eceef5" },
  Matcha: { primary: "oklch(0.55 0.10 150)", soft: "oklch(0.94 0.04 150)" },
  Sakura: { primary: "oklch(0.62 0.13 12)", soft: "oklch(0.95 0.035 12)" },
  Hojicha: { primary: "oklch(0.52 0.10 50)", soft: "oklch(0.93 0.04 60)" },
};

const SHIFT_DEFAULT = { open: false, openingCash: 0, openedAt: null, closedAt: null };

export default function App() {
  const [t, setTweaks] = usePersistentState("fuwa_tweaks", TWEAK_DEFAULTS);
  const [view, setView] = useState("order");
  const [menu, setMenu] = usePersistentState("fuwa_menu", PRODUCTS);
  const [mods, setMods] = usePersistentState("fuwa_mods", MOD_GROUPS);
  const [cats, setCats] = usePersistentState("fuwa_cats", CATEGORIES);
  const [users, setUsers] = usePersistentState("fuwa_users", DEFAULT_USERS);
  const [orders, setOrders] = usePersistentState("fuwa_orders", []);
  const [shiftHistory, setShiftHistory] = usePersistentState("fuwa_shift_history", []);
  const [expenses, setExpenses] = usePersistentState("fuwa_expenses", []);
  const [counter, setCounter] = usePersistentState("fuwa_counter", 101);
  const [user, setUser] = usePersistentState("fuwa_user", null);
  const [shift, setShift] = usePersistentState("fuwa_shift", SHIFT_DEFAULT);
  const [lastBackup, setLastBackup] = usePersistentState("fuwa_last_backup", null);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("Aquí");
  const [lastOrder, setLastOrder] = useState(null);
  const [printTarget, setPrintTarget] = useState(null); // orden a reimprimir desde Historial
  const [backupDismissed, setBackupDismissed] = useState(false);

  const setTweak = (key, value) => setTweaks((prev) => ({ ...prev, [key]: value }));

  // Si se edita al empleado en sesión (nombre, rol, color, PIN), refleja los cambios.
  useEffect(() => {
    if (!user) return;
    const fresh = users.find((u) => u.id === user.id);
    if (fresh && JSON.stringify(fresh) !== JSON.stringify(user)) setUser(fresh);
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  // aplica tweaks como variables CSS
  useEffect(() => {
    const root = document.documentElement;
    const th = THEMES[t.theme] || THEMES.Mochi;
    root.style.setProperty("--primary", th.primary);
    root.style.setProperty("--primary-soft", th.soft);
    root.style.setProperty("--display", `"${t.display}", "Baloo 2", system-ui`);
    root.style.setProperty("--r", t.radius + "px");
  }, [t.theme, t.display, t.radius]);

  // Tamaño de papel al imprimir (impresora térmica de rollo o carta). Se inyecta
  // una regla @page porque las variables CSS no son fiables dentro de @page.
  useEffect(() => {
    document.body.setAttribute("data-paper", t.paper);
    let el = document.getElementById("fuwa-print-page");
    if (!el) {
      el = document.createElement("style");
      el.id = "fuwa-print-page";
      document.head.appendChild(el);
    }
    const size = PAPER_PAGE[t.paper] || PAPER_PAGE["80"];
    el.textContent = `@media print { @page { size: ${size}; margin: ${t.paper === "carta" ? "12mm" : "0"}; } }`;
  }, [t.paper]);

  // Reimpresión de una orden vieja: cuando se fija el objetivo y ya está montado
  // en el DOM (PrintDocs), se dispara la impresión y se limpia al terminar.
  useEffect(() => {
    if (!printTarget) return;
    const id = requestAnimationFrame(() => printDoc("receipt", () => setPrintTarget(null)));
    return () => cancelAnimationFrame(id);
  }, [printTarget]);

  // Si la vista actual no está permitida para el rol del usuario, vuelve a Orden.
  useEffect(() => {
    if (!user) return;
    const role = ROLES[user.role] || ROLES.cajero;
    const active = view === "pay" || view === "receipt" ? "order" : view;
    if (!role.nav.includes(active)) setView("order");
  }, [user, view]);

  // ---- carrito ----
  function addLine(line) {
    setCart((c) => [...c, line]);
  }
  function setLineQty(uid, q) {
    setCart((c) => (q <= 0 ? c.filter((l) => l.uid !== uid) : c.map((l) => (l.uid === uid ? { ...l, qty: q } : l))));
  }
  function updateLine(uid, newLine) {
    setCart((c) => c.map((l) => (l.uid === uid ? { ...newLine, uid } : l)));
  }
  function removeLine(uid) {
    setCart((c) => c.filter((l) => l.uid !== uid));
  }
  function clearCart() {
    setCart([]);
  }

  function confirmPayment(payment) {
    const now = new Date();
    const order = {
      number: counter,
      time: now.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }),
      orderType,
      lines: cart,
      payment,
      ts: now.getTime(),
      cashier: user ? user.name : "Barista",
    };
    setOrders((o) => [...o, order]);
    setCounter((n) => n + 1);
    setLastOrder(order);
    setCart([]);
    setView("receipt");
  }
  function newOrder() {
    setCart([]);
    setOrderType("Aquí");
    setView("order");
  }

  // Anula una orden ya cobrada sin borrarla: queda en el historial marcada
  // para auditoría y se excluye de las ventas del resumen y del arqueo.
  function voidOrder(number, reason) {
    setOrders((os) => os.map((o) => (o.number === number ? { ...o, voided: true, voidReason: reason || "", voidedAt: Date.now() } : o)));
  }

  // ---- gastos del turno ----
  function addExpense(concept, amount, method) {
    setExpenses((e) => [...e, { id: "G" + Date.now().toString(36), ts: Date.now(), concept, amount, method, registeredBy: user ? user.name : "Barista" }]);
  }
  function removeExpense(id) {
    setExpenses((e) => e.filter((x) => x.id !== id));
  }

  // ---- caja (turno) ----
  function openRegister(openingCash) {
    setShift({ open: true, openingCash, openedAt: Date.now(), closedAt: null });
    setView("order");
  }
  // Archiva el turno actual (con su efectivo contado y diferencia) en vez de
  // borrar las órdenes, para poder consultarlas después desde Historial.
  function closeShift(countedCash) {
    if (!window.confirm("¿Cerrar caja? El turno se archivará en Historial junto con el arqueo de efectivo.")) return;
    const cashSales = cashFromOrders(orders);
    const cashExpenses = expenses.filter((e) => e.method === "efectivo").reduce((s, e) => s + e.amount, 0);
    const expected = shift.openingCash + cashSales - cashExpenses;
    const stamp = new Date().toLocaleString("es-GT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const archive = {
      id: "S" + Date.now().toString(36),
      openedAt: shift.openedAt,
      closedAt: Date.now(),
      closedAtLabel: stamp,
      openingCash: shift.openingCash,
      cashSales,
      cashExpenses,
      expected,
      counted: countedCash,
      diff: Math.round((countedCash - expected) * 100) / 100,
      orders,
      expenses,
    };
    setShiftHistory((h) => [...h, archive]);
    setShift({ ...SHIFT_DEFAULT, closedAt: stamp });
    setOrders([]);
    setExpenses([]);
    setCart([]);
    setView("order");
  }

  // Reabre un turno archivado para corregirlo: restaura sus órdenes, gastos y
  // fondo al turno actual y lo saca del historial. Requiere que no haya un turno
  // abierto (para no mezclar el efectivo de dos turnos).
  function reopenShift(shiftId) {
    if (shift.open) {
      window.alert("Cierra el turno actual antes de reabrir uno archivado.");
      return;
    }
    const archive = shiftHistory.find((s) => s.id === shiftId);
    if (!archive) return;
    if (!window.confirm(`¿Reabrir el turno del ${archive.closedAtLabel}? Volverá a quedar como turno actual para corregirlo y deberás cerrarlo de nuevo.`)) return;
    setShiftHistory((h) => h.filter((s) => s.id !== shiftId));
    setOrders(archive.orders || []);
    setExpenses(archive.expenses || []);
    setShift({ open: true, openingCash: archive.openingCash, openedAt: archive.openedAt, closedAt: null });
    setView("order");
  }

  // Reimprime el recibo de una orden ya cobrada (turno actual o archivado).
  function reprintOrder(order) {
    setPrintTarget(order);
  }

  function login(u) {
    setUser(u);
    setView("order");
    setCart([]);
  }
  function logout() {
    setUser(null);
    setCart([]);
    setView("order");
  }

  function resetMenu() {
    if (window.confirm("¿Restaurar el menú, las opciones y las categorías originales de FUWA?")) {
      setMenu(PRODUCTS);
      setMods(MOD_GROUPS);
      setCats(CATEGORIES);
    }
  }
  function clearOrders() {
    if (window.confirm("¿Borrar el historial de hoy?")) setOrders([]);
  }

  // ---- respaldo de datos (export/import de localStorage como JSON) ----
  function exportBackup() {
    const data = { version: 1, exportedAt: new Date().toISOString(), menu, mods, cats, users, orders, expenses, shiftHistory, counter, shift, tweaks: t };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuwa-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastBackup(Date.now());
    setBackupDismissed(true);
  }
  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try {
        data = JSON.parse(reader.result);
      } catch {
        window.alert("El archivo no es un respaldo válido de FUWA.");
        return;
      }
      if (!window.confirm("¿Importar este respaldo? Se reemplazarán el menú, empleados, historial y configuración actuales.")) return;
      if (data.menu) setMenu(data.menu);
      if (data.mods) setMods(data.mods);
      if (data.cats) setCats(data.cats);
      if (data.users) setUsers(data.users);
      if (data.orders) setOrders(data.orders);
      if (data.expenses) setExpenses(data.expenses);
      if (data.shiftHistory) setShiftHistory(data.shiftHistory);
      if (typeof data.counter === "number") setCounter(data.counter);
      if (data.shift) setShift(data.shift);
      if (data.tweaks) setTweaks(data.tweaks);
      setLastBackup(Date.now());
      window.alert("Respaldo importado correctamente.");
    };
    reader.readAsText(file);
  }

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const navActive = view === "pay" || view === "receipt" ? "order" : view;

  const ALL_NAV = [
    { id: "order", icon: "order", label: "Orden", badge: cartCount },
    { id: "history", icon: "clock", label: "Historial", badge: orders.length },
    { id: "expenses", icon: "note", label: "Gastos", badge: expenses.length },
    { id: "closeshift", icon: "lock", label: "Cerrar caja" },
    { id: "menu", icon: "edit", label: "Menú" },
    { id: "summary", icon: "chart", label: "Resumen" },
    { id: "staff", icon: "users", label: "Empleados" },
    { id: "tools", icon: "tools", label: "Herramientas" },
  ];

  // ---- Login gate ----
  if (!user) {
    return (
      <>
        <Login onLogin={login} users={users} />
        <Tweaks t={t} setTweak={setTweak} />
      </>
    );
  }

  const role = ROLES[user.role] || ROLES.cajero;
  const NAV = ALL_NAV.filter((n) => role.nav.includes(n.id));
  const canManage = user.role === "admin";
  // Vista efectiva: si el rol no la permite, un efecto ya la corrige a "order";
  // mientras tanto se renderiza Orden para no mostrar contenido no autorizado.
  const safeView = role.nav.includes(navActive) ? view : "order";
  const backupStale = !backupDismissed && daysSince(lastBackup) >= BACKUP_STALE_DAYS && (orders.length > 0 || shiftHistory.length > 0);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--cream)" }}>
      {/* ---- Sidebar ---- */}
      <nav style={{ width: 96, background: "#fff", borderRight: "2px solid var(--line)", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", flexShrink: 0, zIndex: 10 }}>
        <div style={{ marginBottom: 26 }}>
          <Mascot size={44} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, width: "100%", padding: "0 12px" }}>
          {NAV.map((n) => {
            const active = navActive === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  padding: "12px 0",
                  border: "none",
                  borderRadius: 16,
                  cursor: "pointer",
                  fontFamily: "var(--ui)",
                  fontWeight: 800,
                  fontSize: 12,
                  background: active ? "var(--primary-soft)" : "transparent",
                  color: active ? "var(--primary)" : "var(--muted)",
                  transition: "all .12s ease",
                }}
              >
                <Icon name={n.icon} size={25} stroke={active ? 2.4 : 2} />
                {n.label}
                {n.badge > 0 && (
                  <span style={{ position: "absolute", top: 6, right: 14, minWidth: 19, height: 19, padding: "0 5px", borderRadius: 999, background: "var(--gold)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {n.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ fontFamily: "var(--jp)", fontSize: 10, color: "var(--gold)", letterSpacing: 1, writingMode: "vertical-rl", marginTop: 12, opacity: 0.7 }}>ふわふわ</div>
      </nav>

      {/* ---- Topbar + contenido ---- */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ height: 64, background: "#fff", borderBottom: "2px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", flexShrink: 0 }}>
          <Logo size={30} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              title={shift.open ? "Caja abierta" : "Caja cerrada"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 12.5,
                background: shift.open ? "var(--primary-soft)" : "oklch(0.94 0.05 25)",
                color: shift.open ? "var(--primary)" : "oklch(0.5 0.16 25)",
              }}
            >
              <Icon name={shift.open ? "unlock" : "lock"} size={15} /> {shift.open ? "Caja abierta" : "Caja cerrada"}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--navy)", whiteSpace: "nowrap", lineHeight: 1.25 }}>{user.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap", lineHeight: 1.25 }}>{role.label} · Caja 1</div>
            </div>
            <Avatar user={user} size={42} />
            <button
              onClick={logout}
              title="Cerrar sesión"
              style={{ width: 40, height: 40, borderRadius: 12, border: "2px solid var(--line)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}
            >
              <Icon name="logout" size={20} />
            </button>
          </div>
        </header>

        {/* Aviso de respaldo: alerta del riesgo de perder datos si hace varios días que no se respalda. */}
        {backupStale && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 22px", background: "oklch(0.95 0.06 85)", borderBottom: "2px solid oklch(0.85 0.1 85)", color: "oklch(0.42 0.09 70)", flexShrink: 0 }}>
            <Icon name="note" size={20} />
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>
              {lastBackup ? `Hace ${Math.floor(daysSince(lastBackup))} días que no respaldas.` : "Aún no has respaldado los datos."} Todo se guarda solo en este navegador: si se borra la caché o falla el equipo, se pierde. Descarga un respaldo.
            </div>
            {canManage && (
              <button onClick={exportBackup} style={{ border: "none", background: "var(--navy)", color: "#fff", borderRadius: 999, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "var(--ui)", whiteSpace: "nowrap" }}>
                Respaldar ahora
              </button>
            )}
            <button onClick={() => setBackupDismissed(true)} aria-label="Descartar" title="Descartar por ahora" style={{ border: "none", background: "transparent", color: "inherit", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4 }}>
              ✕
            </button>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          {safeView === "order" &&
            (shift.open ? (
              <OrderScreen
                cart={cart}
                menu={menu}
                mods={mods}
                cats={cats}
                addLine={addLine}
                setLineQty={setLineQty}
                updateLine={updateLine}
                removeLine={removeLine}
                clearCart={clearCart}
                onCheckout={() => setView("pay")}
                orderType={orderType}
                setOrderType={setOrderType}
                showEmoji={t.showEmoji}
              />
            ) : (
              <OpenRegister onOpen={openRegister} lastClose={shift.closedAt} />
            ))}
          {safeView === "pay" && <PayScreen cart={cart} orderType={orderType} tipEnabled={t.tipEnabled} onBack={() => setView("order")} onConfirm={confirmPayment} />}
          {safeView === "receipt" && lastOrder && <Receipt order={lastOrder} onNew={newOrder} />}
          {safeView === "history" && <HistoryScreen orders={orders} shiftHistory={shiftHistory} onVoid={voidOrder} onReprint={reprintOrder} onReopenShift={canManage ? reopenShift : null} />}
          {safeView === "closeshift" && <CloseShiftScreen shiftOpen={shift.open} openingCash={shift.openingCash} orders={orders} expenses={expenses} onCloseShift={closeShift} />}
          {safeView === "expenses" && (
            <ExpensesScreen
              expenses={expenses}
              onAdd={addExpense}
              onRemove={removeExpense}
              availableCash={shift.openingCash + cashFromOrders(orders) - expenses.filter((e) => e.method === "efectivo").reduce((s, e) => s + e.amount, 0)}
            />
          )}
          {safeView === "menu" && <MenuEditor menu={menu} setMenu={setMenu} mods={mods} setMods={setMods} cats={cats} setCats={setCats} />}
          {safeView === "summary" && <SummaryScreen orders={orders} expenses={expenses} cats={cats} shiftHistory={shiftHistory} />}
          {safeView === "staff" && <StaffEditor users={users} setUsers={setUsers} currentUser={user} />}
          {safeView === "tools" && <ToolsScreen onResetMenu={resetMenu} onClearOrders={clearOrders} onExport={exportBackup} onImport={importBackup} lastBackup={lastBackup} />}
        </div>
      </main>

      {/* ---- Tweaks ---- */}
      <Tweaks t={t} setTweak={setTweak} />

      {/* Documentos para reimprimir una orden vieja (ocultos salvo al imprimir). */}
      <PrintDocs order={printTarget} />
    </div>
  );
}
