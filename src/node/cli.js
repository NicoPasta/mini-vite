import { Command } from "commander";
import { startDevServer } from "./server/index.js";

const comd = new Command();

comd
  .name("mini-vite")
  .option("-d, --dev <mode>", "dev mode")
  .action(async (name, options, command) => {
    await startDevServer();
  })
  // .parse(process.argv);
  .parse();
