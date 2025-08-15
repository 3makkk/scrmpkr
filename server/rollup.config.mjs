import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { builtinModules } from "node:module";

// Externalize only Node built-ins; bundle all npm deps
const external = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default {
  input: "index.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
    sourcemap: true,
    exports: "auto",
  },
  external,
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    json(),
    typescript({ tsconfig: "./tsconfig.json", module: "esnext" }),
  ],
  treeshake: false,
};
