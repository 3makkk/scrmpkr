import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { builtinModules } from "node:module";

// Externalize Node built-ins and pino packages that have CommonJS/worker issues
const external = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
  // Externalize pino packages to avoid __dirname issues in bundled ESM
  "pino",
  "pino-pretty",
  "pino/file",
  "thread-stream",
];

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
  },
  external,
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    json(),
    typescript({
      tsconfig: "./tsconfig.json",
      module: "esnext",
      target: "ES2022",
    }),
  ],
  treeshake: false,
};
