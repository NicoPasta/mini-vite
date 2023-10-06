import { esbuildTransfromPlugin } from "./esbuildTransform.js";
import { importAnalysis } from "./importAnalysis.js";
import { resolvePlugin } from "./pathResolve.js";
import { assetsPlugin } from "./assets.js";
import { cssPlugin } from "./css.js";

export const resolvePlugins = () => {
  return [
    resolvePlugin(),
    cssPlugin(),
    esbuildTransfromPlugin(),
    importAnalysis(),
    assetsPlugin(),
  ];
};
