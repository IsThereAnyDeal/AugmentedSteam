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
        this._server = false;

        this._config = require("../webpack/webpack.common.cjs");
    }

    set development(value) {
        this._development = value;
    }

    set server(value) {
        this._server = value;
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

        if (this._server) {
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
        if (!this._development && this._server) {
            throw new Error("Hot reload server requires development mode");
        }

        const options = this._buildOptions();

        webpack(
            merge(this._config, options),
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
