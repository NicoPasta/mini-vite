// import { fileURLToPath } from "node:url";
// import { dirname } from "node:path";
const path = require("path");
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

module.exports = {
  mode: "development",
  entry: "./src/node/cli.js",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "lib"),
    library: {
      type: "umd",
      name: "mini-vite",
    },
  },
  target: "node",
};
