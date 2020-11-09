const webpack = require("webpack");
const {merge} = require("webpack-merge");
const path = require("path");
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");
const ExtensionReloader = require("webpack-extension-reloader");
const ZipPlugin = require("zip-webpack-plugin");
const UpdateManifestScriptsPlugin = require("./Plugins/UpdateManifestScriptsPlugin.cjs");
const PreprocessChangelogPlugin = require("./Plugins/PreprocessChangelogPlugin.cjs");

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

        options.output = {
            "path": path.resolve(this._config.output.path, `${this._mode}.${this._browser}`)
        };

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
            }),
            new UpdateManifestScriptsPlugin({
                "js": ["js/browser-polyfill.js", "js/dompurify.js"]
            }),
            new PreprocessChangelogPlugin({
                "path": path.resolve(__dirname, "../../changelog.yml")
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

        if (!this._development) {
            options.plugins.push(
                new ZipPlugin({
                    "path": this._config.output.path,
                    "filename": `${this._browser}.zip`
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
