import { defineConfig } from "tsup";

export default defineConfig((opts) => ({
  entry: ["src/index.tsx"],
  format: ["esm", "cjs"],
  splitting: true,
  sourcemap: true,
  minify: !opts.watch,
  clean: !opts.watch,
  external: ["react", "react-dom"],
  platform: "browser",
  dts: true,
  outDir: "dist",
  treeshake: true,
}));
