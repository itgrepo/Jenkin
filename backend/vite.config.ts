import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/e-standard/",
  plugins: [react()],
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@models": path.resolve(__dirname, "src/models"),
      "@services": path.resolve(__dirname, "src/services"),
      "@store": path.resolve(__dirname, "src/store"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@auth": path.resolve(__dirname, "src/auth"),
      "@layout": path.resolve(__dirname, "src/layout"),
      "@theme": path.resolve(__dirname, "src/theme"),
      "@locales": path.resolve(__dirname, "src/locales"),
      "@routes": path.resolve(__dirname, "src/routes"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@features": path.resolve(__dirname, "src/features"),
      "@data": path.resolve(__dirname, "src/data"),
    },
  },
});
