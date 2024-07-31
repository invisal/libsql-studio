import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./gui/index.ts", "./gui/driver.ts"],
  outDir: "./gui/dist",
  splitting: true,
  sourcemap: true,
  clean: true,
  dts: true,
  platform: "browser",
  treeshake: true,
  format: ["esm", "cjs"],
  minify: true,
  external: ["react", "react-dom", "next"],
});
