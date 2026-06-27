/* FUWA POS — datos del menú, categorías, tamaños y modificadores.
   Moneda: Quetzal (Q). Precios ya incluyen impuestos. */

// Colores pastel kawaii derivados de un tono (hue) para mantener consistencia
// entre categorías nuevas y existentes (misma chroma/lightness, varía el hue).
export function catColors(hue) {
  return { tint: `oklch(0.90 0.055 ${hue})`, ink: `oklch(0.45 0.09 ${hue})` };
}

const C = (id, name, icon, hue) => ({ id, name, icon, hue, ...catColors(hue) });

// Categorías por defecto (editables desde el editor de menú)
export const CATEGORIES = [
  C("matcha", "Matcha", "🍵", 150),
  C("cafe", "Café", "☕", 70),
  C("boba", "Boba & Té", "🧋", 25),
  C("frio", "Bebidas Frías", "🧊", 235),
  C("postres", "Postres", "🍮", 320),
];

// Grupos de modificadores reutilizables
const MOD_LECHE = {
  id: "leche",
  label: "Leche",
  type: "single",
  required: false,
  options: [
    { name: "Entera", delta: 0 },
    { name: "Deslactosada", delta: 3 },
    { name: "Almendra", delta: 5 },
    { name: "Avena", delta: 5 },
    { name: "Soya", delta: 4 },
  ],
};
const MOD_AZUCAR = {
  id: "azucar",
  label: "Nivel de azúcar",
  type: "single",
  required: false,
  options: [
    { name: "0%", delta: 0 },
    { name: "25%", delta: 0 },
    { name: "50%", delta: 0 },
    { name: "100%", delta: 0 },
  ],
};
const MOD_EXTRAS = {
  id: "extras",
  label: "Extras",
  type: "multi",
  required: false,
  options: [
    { name: "Shot extra", delta: 6 },
    { name: "Boba", delta: 5 },
    { name: "Crema batida", delta: 4 },
    { name: "Jelly", delta: 4 },
  ],
};

export const SIZES_BEBIDA = [
  { name: "Chico", delta: -3 },
  { name: "Mediano", delta: 0 },
  { name: "Grande", delta: 5 },
];

export const MOD_GROUPS = { leche: MOD_LECHE, azucar: MOD_AZUCAR, extras: MOD_EXTRAS };

export const PRODUCTS = [
  // Matcha
  { id: "p_matcha_latte", cat: "matcha", name: "Matcha Latte", price: 32, desc: "Matcha ceremonial batido", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_hojicha", cat: "matcha", name: "Hojicha Latte", price: 34, desc: "Té tostado, notas a nuez", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_matcha_fresa", cat: "matcha", name: "Matcha Fresa", price: 38, desc: "Matcha con puré de fresa", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_iced_matcha", cat: "matcha", name: "Iced Matcha", price: 35, desc: "Matcha frío sobre hielo", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_matcha_coco", cat: "matcha", name: "Matcha Coco", price: 38, desc: "Crema de coco y matcha", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },

  // Café
  { id: "p_espresso", cat: "cafe", name: "Espresso", price: 18, desc: "Doble shot", sizes: null, mods: ["azucar", "extras"] },
  { id: "p_americano", cat: "cafe", name: "Americano", price: 22, desc: "Espresso con agua caliente", sizes: SIZES_BEBIDA, mods: ["azucar", "extras"] },
  { id: "p_latte", cat: "cafe", name: "Latte", price: 28, desc: "Espresso con leche vaporizada", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_capp", cat: "cafe", name: "Cappuccino", price: 28, desc: "Espuma cremosa", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_mocha", cat: "cafe", name: "Mocha", price: 32, desc: "Chocolate y espresso", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_dirty_matcha", cat: "cafe", name: "Dirty Matcha", price: 38, desc: "Matcha con shot de espresso", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },

  // Boba & Té
  { id: "p_milk_tea", cat: "boba", name: "Milk Tea Clásico", price: 30, desc: "Té negro con perlas", sizes: SIZES_BEBIDA, mods: ["azucar", "extras"] },
  { id: "p_taro", cat: "boba", name: "Taro Boba", price: 34, desc: "Taro cremoso con perlas", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_brown_sugar", cat: "boba", name: "Brown Sugar Boba", price: 36, desc: "Perlas en azúcar mascabado", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_fruit_tea", cat: "boba", name: "Té de Frutas", price: 30, desc: "Té con frutas de temporada", sizes: SIZES_BEBIDA, mods: ["azucar", "extras"] },
  { id: "p_thai", cat: "boba", name: "Thai Tea", price: 32, desc: "Té tailandés especiado", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },

  // Bebidas frías
  { id: "p_iced_latte", cat: "frio", name: "Iced Latte", price: 30, desc: "Latte sobre hielo", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },
  { id: "p_cold_brew", cat: "frio", name: "Cold Brew", price: 30, desc: "Extracción en frío 18h", sizes: SIZES_BEBIDA, mods: ["azucar", "extras"] },
  { id: "p_yuzu", cat: "frio", name: "Limonada Yuzu", price: 28, desc: "Cítrico japonés refrescante", sizes: SIZES_BEBIDA, mods: ["azucar", "extras"] },
  { id: "p_frappe", cat: "frio", name: "Frappé Matcha", price: 40, desc: "Frappé cremoso de matcha", sizes: SIZES_BEBIDA, mods: ["leche", "azucar", "extras"] },

  // Postres
  { id: "p_souffle", cat: "postres", name: "Soufflé Pancake", price: 45, desc: "Esponjoso, 3 capas", sizes: null, mods: ["extras"] },
  { id: "p_mochi", cat: "postres", name: "Mochi (3 pzs)", price: 28, desc: "Surtido del día", sizes: null, mods: [] },
  { id: "p_dorayaki", cat: "postres", name: "Dorayaki", price: 22, desc: "Relleno de anko", sizes: null, mods: [] },
  { id: "p_cheesecake", cat: "postres", name: "Cheesecake Japonés", price: 38, desc: "Ligero y aireado", sizes: null, mods: [] },
  { id: "p_taiyaki", cat: "postres", name: "Taiyaki", price: 25, desc: "Waffle de pescadito relleno", sizes: null, mods: ["extras"] },
];
