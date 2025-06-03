// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

import playformCompress from "@playform/compress";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      minify: false,
    },
  },

  output: "server",

  adapter: cloudflare({
    platformProxy: {
      enabled: false,
    },
  }),

  integrations: [playformCompress()],
});