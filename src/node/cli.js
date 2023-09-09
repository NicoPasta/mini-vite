const { Command } = require("commander");
const comd = new Command();

comd
  .name("mini-vite")
  .option("-d, --dev <mode>", "dev mode")
  .action((name, options, command) => {
    // console.log(process.argv);
  })
  // .parse(process.argv);
  .parse();
