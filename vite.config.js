import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@config": path.resolve(__dirname, "firebase/firebaseConfig"), // Firebase client config alias
      "@admin": path.resolve(__dirname, "firebase/firebaseAdmin"), // Firebase admin config alias
    },
  },
  build: {
    rollupOptions: {
      external: ["firebase"], // Exclude firebase from the bundle
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"], // Other common packages
        },
      },
    },
    assetsInclude: ["**/*.woff", "**/*.woff2"], // Include font files
  },
  define: {
    "process.env": process.env, // Pass environment variables to the app
  },
});
