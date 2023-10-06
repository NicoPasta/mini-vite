import { ASSSETS_EXTENSION } from "../constants.js";
import {
  cleanUrl,
  normalizePath,
  removeImportQuery,
  resolveUrl,
} from "../util.js";

export const assetsPlugin = () => {
  let serverContext;
  return {
    name: "m-vite:assets-plugin",
    configServer(s) {
      serverContext = s;
    },
    async load(id, importer) {
      if (id.endsWith("?import")) {
        const cleanedId = removeImportQuery(cleanUrl(id));

        return `export default ${cleanedId}`;
      }
    },
  };
};
