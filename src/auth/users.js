/* FUWA POS — usuarios de prueba, roles y permisos de navegación. */

// Roles y permisos de navegación
export const ROLES = {
  admin: { label: "Gerente", color: "oklch(0.55 0.10 150)", nav: ["order", "history", "expenses", "closeshift", "menu", "summary", "staff", "tools"] },
  cajero: { label: "Cajero/Barista", color: "oklch(0.58 0.11 235)", nav: ["order", "history", "expenses", "closeshift"] },
};

// Empleados por defecto (editables desde "Empleados"). El PIN se muestra como
// pista por ser un prototipo demo.
export const DEFAULT_USERS = [
  { id: "u1", name: "Mariko Tanaka", role: "admin", pin: "1234", hue: 150 },
  { id: "u2", name: "Sofía Gómez", role: "cajero", pin: "1111", hue: 25 },
  { id: "u3", name: "Diego Ramírez", role: "cajero", pin: "2222", hue: 235 },
];

export function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}
