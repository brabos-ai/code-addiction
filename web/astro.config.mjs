import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://code.brabos.ai",
  vite: {
    plugins: [tailwindcss()],
  },
});
