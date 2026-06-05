import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Jika di local ada request ke /api, oper ke Node.js lokal
      "/api": {
        target: "https://trade.syreldigital.web.id", // Sesuaikan dengan port Node.js lokalmu
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
