// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import { annotationApiPlugin } from "./src/lib/annotation-api";

export default defineConfig({
  site: "https://ffledgling.dev",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), annotationApiPlugin()],
  },
});
