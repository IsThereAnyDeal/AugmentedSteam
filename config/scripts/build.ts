import WebpackRunner from "../webpack/WebpackRunner.js";
import * as argparse from "argparse";
import Browser from "../browser.js";

const browsers = Object.values(Browser);
const choices = ["all"].concat(browsers);

const parser = new argparse.ArgumentParser({
    "add_help": true,
});
parser.add_argument("browser", {
    "type": "str",
    "choices": choices,
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

// Don't know why the return type is any here, the function either exits with an error or returns a namespace
const args = parser.parse_args() as argparse.Namespace;

let run: Browser[] = [];
if (args["browser"] === "all") {
    if (args["server"] === true) {
        throw new Error("Running hot reload server is supported only for single browser instance");
    }

    run = browsers;
} else {
    run = [args["browser"] as Browser];
}

for (const browser of run) {
    const runner = new WebpackRunner({
        browser,
        "development": args["production"] !== true,
        "server": args["server"] === true,
    });
    runner.run();
}
