import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/scorm": {
          target: "https://jodex-s3.s3.eu-north-1.amazonaws.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/scorm/, ""),
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
});
