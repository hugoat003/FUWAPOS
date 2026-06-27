/* FUWA POS — persistencia en localStorage del navegador. */
import { useEffect, useState } from "react";

export const LS = {
  get(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* almacenamiento lleno o no disponible */
    }
  },
};

// Estado de React respaldado por localStorage.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => LS.get(key, initial));
  useEffect(() => {
    LS.set(key, value);
  }, [key, value]);
  return [value, setValue];
}
