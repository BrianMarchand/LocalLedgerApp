import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@config": "/firebase/firebaseConfig", // Alias for firebaseConfig.js (client-side)
      "@admin": "/firebase/firebaseAdmin.js", // Optional alias for firebaseAdmin.js (server-side)
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "firebase"], // Splits vendor code
        },
      },
    },
  },
});
