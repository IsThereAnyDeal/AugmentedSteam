const WebpackRunner = require("../webpack/WebpackRunner.cjs");

const browser = process.argv.includes("firefox") ? "firefox" : "chrome";
const runner = new WebpackRunner(browser);
runner.development = !process.argv.includes("prod");
runner.run();
