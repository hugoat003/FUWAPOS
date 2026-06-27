import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// FUWA POS — desarrollo y build con Vite + React.
export default defineConfig({
  plugins: [react()],
  server: { open: true },
});
