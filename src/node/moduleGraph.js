import { removeImportQuery, removeTimestampQuery } from "./util.js";

export class ModuleNode {
  // 绝对路径
  id = null;
  //   被哪些模块引入
  importers = new Set();
  //   引入的模块
  importedModules = new Set();
  transformResult = null;
  lastHMRTimestamp = 0;
  constructor(url) {
    // 请求路径
    this.url = url;
  }
}

export class ModuleGraph {
  // 原始请求url
  urlToModuleMap = new Map();
  // 绝对路径文件地址
  fileToModulesMap = new Map();
  constructor(resolveId) {
    // container的resolveId函数，调用resolveId钩子
    this._resolve = resolveId;
  }

  // getModuleById(id) {
  //   return this.idToModuleMap.get(id);
  // }

  // getModuleById(id) {
  //   return this.idToModuleMap.get(id);
  // }

  // 是个set，可能单文件多个模块
  getModulesByFile(file) {
    return this.fileToModulesMap.get(file);
  }

  getModuleByUrl(rawUrl) {
    return this.urlToModuleMap.get(rawUrl);
  }

  onFileChange(file) {
    const mods = this.getModulesByFile(file);
    if (mods) {
      mods.forEach((mod) => {
        this.invalidateModule(mod);
      });
    }
  }

  // 初始化url对应的模块
  async ensureEntryFromUrl(rawUrl) {
    const { id: resolvedId, url } = await this.resolve(rawUrl);
    if (this.urlToModuleMap.has(url)) {
      return this.urlToModuleMap.get(url);
    }

    const mod = new ModuleNode(url);
    mod.id = resolvedId;
    mod.file = resolvedId;
    // 请求url到module
    this.urlToModuleMap.set(url, mod);
    // 绝对路径到modules
    let fileMappedModules = this.fileToModulesMap.get(resolvedId);
    if (!fileMappedModules) {
      fileMappedModules = new Set();
      this.fileToModulesMap.set(resolvedId, fileMappedModules);
    }
    fileMappedModules.add(mod);
    return mod;
  }

  async updateModuleInfo(currentMod, importedModules) {
    const prevImports = currentMod.importedModules;

    // 更新依赖关系
    for (const mod of importedModules) {
      const dep =
        typeof mod === "string" ? await this.ensureEntryFromUrl(mod) : mod;
      if (dep) {
        currentMod.importedModules.add(dep);
        dep.importers.add(currentMod);
      }
    }

    // 删掉失效的依赖关系
    for (const prevMod of prevImports) {
      if (!importedModules.has(prevMod.url)) {
        // 如果新的imported中不存在这个module了，在模块依赖图中删除对应module的importer
        prevMod.importers.delete(currentMod);
        // 找到废弃的url
        const tobeDelete = [...currentMod.importedModules].find(
          (m) => m.url === prevMod.url
        );
        // 删除
        currentMod.importedModules.delete(tobeDelete);
      }
    }
  }

  // invalidateModuleById(id) {
  //   const mod = this.idToModuleMap.get(id);
  //   this.invalidateModule(mod);
  // }

  // invalidateAll() {
  //   this.idToModuleMap.forEach((mod) => {
  //     this.invalidateModule(mod);
  //   });
  // }

  invalidateModule(mod) {
    mod.lastHMRTimestamp = Date.now();
    mod.transformResult = null;
    // 所有引用链上的模块
    mod.importers.forEach((importer) => {
      // 递归，所有模块引用链上的模块都需要重新编译
      this.onFileChange(importer.id);
    });
  }

  async resolve(rawUrl) {
    // 去掉时间戳和？import
    const cleanUrl = removeImportQuery(removeTimestampQuery(rawUrl));
    const resolvedId = await this._resolve(cleanUrl);
    const id = resolvedId.id ?? resolvedId;
    return { id, url: cleanUrl };
  }
}
