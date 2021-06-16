const WebpackRunner = require("../webpack/WebpackRunner.cjs");
const argparse = require("argparse");

const browsers = Object.freeze(["chrome", "firefox", "edge"]);

const parser = new argparse.ArgumentParser({
    "add_help": true
});
parser.add_argument("browser", {
    "type": "str",
    "choices": ["all"].concat(browsers),
    "help": "Browser for which to build the extension"
});
parser.add_argument("-p", "--production", {
    "action": argparse.BooleanOptionalAction,
    "help": "Build for production",
    "default": false
});
parser.add_argument("-s", "--server", {
    "action": argparse.BooleanOptionalAction,
    "help": "Build with hot reload support and run server (only development)",
    "default": false
});

const args = parser.parse_args();

let run = [];
if (args.browser === "all") {
    if (args.server) {
        throw new Error("Running hot reload server is supported only for single browser instance");
    }

    run = browsers;
} else {
    run = [args.browser];
}

for (const browser of run) {
    const runner = new WebpackRunner(browser);
    runner.development = !args.production;
    runner.server = args.server;
    runner.run();
}
