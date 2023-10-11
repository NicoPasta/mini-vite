console.log("[m-vite] connecting.");

const socket = new WebSocket(`ws://localhost:__HMR_PORT__`, "vite-hmr");

socket.addEventListener("message", async ({ data }) => {
  handleMessage(JSON.parse(data)).catch(console.error);
});

const handleMessage = async (payload) => {
  switch (payload.type) {
    case "connected":
      console.log(`[m-vite] connected.`);
      // 心跳检测
      setInterval(() => socket.send("ping"), 1000);
      break;

    case "update":
      // 进行具体的模块更新
      payload.updates.forEach((update) => {
        if (update.type === "js-update") {
          fetchUpdate(update);
        }
      });
      break;
  }
};

// HMR模块，回调映射表
const hotModulesMap = new Map();

// 模块失效回调
const pruneMap = new Map();

export const createHotContext = (ownerPath) => {
  // 每次加载模块重新注册回调
  const mod = hotModulesMap.get(ownerPath);
  if (mod) {
    mod.callbacks = [];
  }

  function acceptDeps(deps, callback) {
    const mod = hotModulesMap.get(ownerPath) || {
      id: ownerPath,
      callbacks: [],
    };
    // callbacks 属性存放 accept 的依赖、依赖改动后对应的回调逻辑
    mod.callbacks.push({
      deps,
      fn: callback,
    });
    hotModulesMap.set(ownerPath, mod);
  }

  return {
    accept(deps, callback) {
      // 这里仅考虑接受自身模块更新的情况
      // import.meta.hot.accept(() => {})
      if (typeof deps === "function") {
        acceptDeps([ownerPath], ([mod]) => deps(mod));
      }
    },
    // 模块不再生效的回调
    // import.meta.hot.prune(() => {})
    prune(cb) {
      pruneMap.set(ownerPath, cb);
    },
  };
};

const fetchUpdate = async (update) => {
  // vite中会根据path和acceptedPath的不同，处理不同的逻辑
  // 具体来说就是一个模块可能接受多个模块的更新，同时一个mod也可以注册多个不同的回调
  // 所以 mod => callbacks => deps && calback
  // 更新时，根据update给的信息寻找当前模块中，要更新的dep，并触发它们对应callback
  // mini-vite只考虑自身更新
  // https://github.com/vitejs/vite/blob/v2.7/packages/vite/src/client/client.ts#L287
  const { path, acceptedPath, timestamp } = update;
  const mod = hotModulesMap.get(path);
  if (!mod) return;

  const moduleMap = new Map();
  const modulesToUpdate = new Set();

  modulesToUpdate.add(path);

  await Promise.all(
    Array.from(modulesToUpdate).map(async (dep) => {
      const [path, query] = dep.split(`?`);
      try {
        // 通过动态 import 拉取最新模块
        const newMod = await import(
          path + `?t=${timestamp}${query ? `&${query}` : ""}`
        );
        moduleMap.set(dep, newMod);
      } catch (e) {}
    })
  );

  return () => {
    // 拉取最新模块后执行更新回调
    for (const { deps, fn } of mod.callbacks) {
      // dep url => dep mod，更新回调
      fn(deps.map((dep) => moduleMap.get(dep)));
    }
    console.log(`[m-vite] hot updated: ${path}`);
  };
};
