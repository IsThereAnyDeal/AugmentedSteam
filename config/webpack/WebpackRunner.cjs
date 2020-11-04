const webpack = require("webpack");
const {merge} = require("webpack-merge");
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");
const ExtensionReloader = require("webpack-extension-reloader");

class WebpackRunner {

    constructor(browser) {
        this._browser = browser;

        if (!["firefox", "chrome"].includes(this._browser)) {
            throw new Error(`Unknown browser ${this._browser}`);
        }

        this._development = true;
        this._hotReload = false;
    }

    set development(value) {
        this._development = value;
    }

    set hotReload(value) {
        this._hotReload = value;
    }

    get _mode() {
        return this._development ? "dev" : "prod";
    }

    _buildOptions() {
        const options = {};

        if (this._development) {
            options.mode = "development";
            options.devtool = "eval-source-map";
        } else {
            options.mode = "production";
            options.devtool = "source-map";
        }

        options.entry = {
            "css/augmentedsteam": `./src/css/augmentedsteam-${this._browser}.css`
        };

        options.plugins = [
            new MergeJsonWebpackPlugin({
                "files": [
                    "config/manifests/manifest_common.json",
                    `config/manifests/manifest_${this._browser}.json`,
                    `config/manifests/manifest_${this._mode}.json`,
                ],
                "output": {
                    "fileName": "manifest.json",
                },
                "space": this._development ? "\t" : null,
            })
        ];

        if (this._hotReload) {
            options.watch = true;
            options.plugins.push(
                new ExtensionReloader({
                    "entries": {
                        "background": "background",
                        "extensionPage": "options",
                        "contentScript":
                            Object.keys(this._config.entry)
                                .filter(entry => entry !== "background" && entry !== "options"),
                    }
                })
            );
        }

        return options;
    }

    run() {
        if (!this._development && this._hotReload) {
            throw new Error("HotReload support requires development mode");
        }

        const config = require("../webpack/webpack.common.cjs");
        const options = this._buildOptions();

        webpack(
            merge(config, options),
            (err, stats) => {
                if (err) {
                    console.error(err.stack || err);
                    if (err.details) {
                        console.error(err.details);
                    }
                    return;
                }

                console.log(stats.toString({
                    "colors": true,
                }));
            }
        );
    }
}

module.exports = WebpackRunner;
