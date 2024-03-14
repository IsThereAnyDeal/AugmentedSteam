import {Argument, Command} from "commander";
import builder from "./tools/builder.mjs";

const browsers = Object.freeze(["chrome", "firefox", "edge"]);

(new Command())
    .option("-p, --production", "Build for production", false)
    .addArgument(
        (new Argument("[browser]", "Browser for which to build AugmentedSteam"))
            .choices(browsers)
            .default("all")
    )
    .action(async (browser, options) => {
        let run = [];
        if (browser === "all") {
            run = browsers;
        } else {
            run = [browser];
        }

        for (const browser of run) {
            await builder({
                browser,
                dev: !options.production
            })
        }
    })
    .parse();
