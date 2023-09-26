import webpack from "webpack";
import {merge} from "webpack-merge";
import path from "path";
import fs from "fs";
import MergeJsonWebpackPlugin from "merge-json-webpack-plugin";
import {default as ExtensionReloader, type IExtensionReloaderInstance} from "webpack-ext-reloader";
import FileManagerPlugin from "filemanager-webpack-plugin";
import ManifestTransformerPlugin from "./Plugins/ManifestTransformerPlugin";
import PreprocessChangelogPlugin from "./Plugins/PreprocessChangelogPlugin";
import type Browser from "../browser";
import config from "../webpack/webpack.common";

const rootDir = path.resolve(__dirname, "../..");

type Options = {
    browser: Browser;
    development: boolean;
    server: boolean;
};

export default class WebpackRunner {

    private readonly browser: Browser;
    private readonly development: boolean;
    private readonly server: boolean;

    public constructor(options: Options) {
        this.browser = options.browser;

        if (!["firefox", "chrome", "edge"].includes(this.browser)) {
            throw new Error(`Unknown browser ${this.browser}`);
        }

        this.development = options.development;
        this.server = options.server;
    }

    private get mode(): string {
        return this.development ? "dev" : "prod";
    }

    private get outputDirectoryName(): string {
        return path.resolve(config.output.path, `${this.mode}.${this.browser}`);
    }

    public run(): void {
        if (!this.development && this.server) {
            throw new Error("Hot reload server requires development mode");
        }

        const options = this.buildOptions();

        webpack.webpack(
            merge<webpack.Configuration>(config, options),
            (err, stats) => {
                if (err) {
                    console.error(err.stack ?? err);
                    return;
                }

                if (typeof stats === "undefined") { return; }
                console.log(stats.toString({
                    "colors": true,
                }));
            }
        );
    }

    private buildOptions(): webpack.Configuration {
        const options: webpack.Configuration = {};

        options.output = {
            "path": path.resolve(this.outputDirectoryName)
        };

        if (this.development) {
            options.mode = "development";
            options.devtool = "eval-source-map";
        } else {
            options.mode = "production";
            options.devtool = "source-map";
        }

        options.entry = {
            "css/augmentedsteam": `./src/css/augmentedsteam-${this.browser}.css`
        };


        const manifestsDirectory = "config/manifests";
        const fileNames = [
            "base.json",
            `base.${this.mode}.json`,
            `${this.browser}.json`,
            `${this.browser}.${this.mode}.json`,
        ];

        console.log("\x1b[33;1m%s\x1b[0m", "Building manifest from...");
        const files = [];
        for (const fileName of fileNames) {
            const path = `${manifestsDirectory}/${fileName}`;
            if (fs.existsSync(path)) {
                files.push(path);
                console.log(`  ${manifestsDirectory}/\x1b[32;1m${fileName}\x1b[0m`);
            }
        }
        console.log("");

        options.plugins = [
            new MergeJsonWebpackPlugin({
                "groups": [
                    {
                        files,
                        "to": "manifest.json",
                    }
                ],
                "mergeFn": (object, other) => merge<typeof object>(object, other),
                "minify": !this.development
            }),
            new ManifestTransformerPlugin({
                "js": ["js/browser-polyfill.js", "js/dompurify.js"]
            }),
            new PreprocessChangelogPlugin({
                "path": path.resolve(rootDir, "./changelog.yml")
            }),
            new webpack.DefinePlugin({
                "__BROWSER__": JSON.stringify(this.browser)
            }),
        ];

        if (this.server) {
            options.watch = true;
            options.plugins.push(
                // @ts-expect-error Typings are broken for webpack-ext-reloader, it's only declaring types
                new ExtensionReloader({
                    "entries": {
                        "background": "background",
                        "extensionPage": "options",
                        "contentScript":
                            Object.keys(config.entry)
                                .filter(entry => entry !== "background" && entry !== "options"),
                    }
                }) as IExtensionReloaderInstance,
            );
        }

        if (!this.development) {
            options.plugins.push(
                new FileManagerPlugin({
                    "events": {
                        "onEnd": {
                            "archive": [
                                {
                                    "source": this.outputDirectoryName,
                                    "destination": `${config.output.path}/${this.browser}.zip`,
                                    "options": {
                                        "zlib": {
                                            "level": 6,
                                        }
                                    },
                                },
                            ]
                        }
                    }
                })
            );
        }

        return options;
    }
}
