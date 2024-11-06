const path = require("path");
const typescript = require("@rollup/plugin-typescript");
const terser = require("@rollup/plugin-terser").default;

module.exports = [
  {
    input: path.resolve(__dirname, "src/index.ts"),
    output: {
      file: path.resolve(__dirname, "dist/main/index.js"),
      format: "umd",
      name: "Evt",
      sourcemap: true,
    },
    plugins: [
      typescript({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      terser(),
    ],
  },
  {
    input: path.resolve(__dirname, "src/index.ts"),
    output: {
      file: path.resolve(__dirname, "dist/main/index.mjs"),
      format: "esm",
      sourcemap: true,
    },
    plugins: [
      typescript({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
    ],
  },
  {
    input: path.resolve(__dirname, "scripts/evt-autogen.js"),
    output: {
      file: path.resolve(__dirname, "dist/scripts/evt-autogen"),
      format: "cjs",
    },
    plugins: [terser()],
  },
];
