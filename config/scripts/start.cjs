const webpack = require("webpack");
const {merge} = require("webpack-merge");

const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");
const ExtensionReloader = require("webpack-extension-reloader");

let browser = "chrome";

if (process.argv.includes("firefox")) {
    browser = "firefox";
}

const config = require("../webpack/webpack.dev.cjs");

webpack(merge(config, {
    "watch": true,
    "plugins": [
        new MergeJsonWebpackPlugin({
            "files": [
                "config/manifests/manifest_common.json",
                `config/manifests/manifest_${browser}.json`,
                "config/manifests/manifest_dev.json",
            ],
            "output": {
                "fileName": "manifest.json",
            },
            "space": "\t",
        }),

        /*
         * TODO Once the production dependencies are also handled via npm,
         * this plugin can use the "manifest" key to remove the need of a "entries"
         * property.
         * This doesn't work now because we're using static library files that are
         * not integrated into webpack.
         */
        new ExtensionReloader({
            "entries": {
                "background": "background",
                "extensionPage": "options",
                "contentScript": Object.keys(config.entry).filter(entry => entry !== "background" && entry !== "options"),
            }
        }),
    ],
}), (err, stats) => {

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
});
