# FUWA · Punto de Venta

POS para la cafetería **FUWA** (café estilo asiático: matcha, boba, postres).
Estética suave/kawaii — azul marino + crema + dorado, tomada del logo (mascota mochi,
日本のコーヒー). Moneda: **Quetzal (Q)**. El cliente **paga antes de consumir**.

Implementado con **React + Vite** a partir del prototipo de diseño de FUWA.

## Cómo correrlo

```bash
npm install
npm run dev      # servidor de desarrollo (abre el navegador)
npm run build    # build de producción en dist/
npm run preview  # previsualiza el build
```

## Funcionalidad

- **Login con roles** — empleados con PIN (también se escribe con el teclado físico:
  dígitos, Backspace, Escape). La navegación se filtra por rol. Demo:
  - **Mariko Tanaka** — Gerente · PIN `1234` → acceso total.
  - **Sofía Gómez** — Cajero/Barista · PIN `1111` → solo Orden e Historial.
  - **Diego Ramírez** — Cajero/Barista · PIN `2222` → solo Orden e Historial.
  - El panel azul muestra un **reloj en vivo** y la fecha.
- **Apertura y cierre de caja** — la caja inicia **cerrada**; hay que abrirla con un
  **fondo de apertura** antes de poder tomar órdenes. Con la caja cerrada no se pueden
  crear órdenes. Al cerrar caja se hace el arqueo (fondo + ventas en efectivo).
- **Tomar orden** — menú por categorías, búsqueda, carrito en vivo y Para aquí / Para llevar.
- **Personalización** — tamaño, leche, nivel de azúcar, extras y nota libre para barra/cocina.
- **Cobro** — una cuenta **o pago dividido por productos** (asignas cada producto a la
  persona 1 o 2 y cada quien paga con su propio método: efectivo y/o tarjeta, con cambio).
  Efectivo con montos rápidos y cálculo de cambio; propina opcional.
- **Comanda de cocina** — al cobrar puedes imprimir una **comanda para cocina sin precios**
  (productos, modificadores, notas y si es para aquí/llevar), además del recibo del cliente.
- **Recibo** imprimible con la mascota.
- **Editor de menú** — tres pestañas:
  - **Productos** — agregar / editar / eliminar; **precio por tamaño editable por producto**;
    **icono (emoji) o imagen** por producto.
  - **Leche, azúcar y extras** — recargos editables de cada opción.
  - **Categorías** — agregar / editar / eliminar categorías (nombre, emoji y color/tono).
- **Empleados** — administrar el equipo: agregar / editar / eliminar, rol, PIN y color.
- **Historial del día** — órdenes cobradas, expandibles (incluye pagos divididos).
- **Resumen / cierre de caja** — dashboard con KPIs, ventas por hora, top productos,
  dona de métodos de pago, ventas por categoría y arqueo de efectivo.
- **Tweaks** (botón inferior derecho) — variaciones visuales en vivo: 4 temas
  (Mochi, Matcha, Sakura, Hojicha), 3 tipografías, redondez, iconos y propina.

Todo se guarda en el navegador (`localStorage`): el menú editado, las órdenes,
el usuario en sesión y las preferencias de apariencia persisten al recargar.

## Estructura

```
src/
  main.jsx            arranque de React
  App.jsx             shell: login, navegación por rol, estado y persistencia
  data.js             menú, categorías, tamaños y modificadores
  styles.css          variables de tema y estilos globales
  Tweaks.jsx          panel de personalización en vivo
  lib/                format.js (moneda, cálculo de líneas), storage.js
  components/          Icon, Mascot/Logo, ui (botón, pill, estilos de modal)
  auth/               users (roles/PINs por defecto), Avatar, Login
  screens/            OrderScreen, CustomizeModal, PayScreen (con pago dividido),
                      Receipt (+ comanda de cocina), MenuEditor (productos/opciones/
                      categorías), StaffEditor, OpenRegister, HistoryScreen, SummaryScreen
```

Todo lo editable (menú, opciones, categorías, empleados, órdenes, estado de caja,
usuario en sesión y apariencia) se guarda en `localStorage`.
