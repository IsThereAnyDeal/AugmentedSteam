const webpack = require("webpack");
const merge = require("webpack-merge");
const MergeJsonWebpackPlugin = require("merge-jsons-webpack-plugin");

let browser = "chrome";
let mode = "dev";

if (process.argv.includes("firefox")) {
    browser = "firefox";
}

if (process.argv.includes("prod")) {
    mode = "prod";
}

const config = require(`../webpack/webpack.${mode}.cjs`);

webpack(merge(config, {
    "plugins": [
        new MergeJsonWebpackPlugin({
            "files": [
                "config/manifests/manifest_common.json",
                `config/manifests/manifest_${browser}.json`,
                `config/manifests/manifest_${mode}.json`,
            ],
            "output": {
                "fileName": "manifest.json",
            },
            "space": mode === "dev" ? '\t' : null, 
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
        colors: true,
    }));
});
