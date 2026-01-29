import { defineConfig } from "tsdown";
import Vue from "unplugin-vue/rolldown";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm"],
  platform: "neutral",
  plugins: [Vue({ isProduction: true })],
  dts: { vue: true },
});
