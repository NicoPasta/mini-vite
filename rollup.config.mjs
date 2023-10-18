import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: {
    index: "src/node/cli.js",
    client: "src/client/client.js",
  },

  output: {
    format: "es",
    compact: true,
    dir: "dist",
    plugins: [terser()],
  },

  plugins: [commonjs(), babel()],
};
