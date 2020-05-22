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

const config = require(`./webpack.${mode}.cjs`);

webpack(merge(config, {
    "plugins": [
        new MergeJsonWebpackPlugin({
            "files": [
                "manifest_common.json",
                `./manifest_${browser}.json`,
            ],
            "output": {
                "fileName": "manifest.json"
            },
        }),
    ],
}), (err, stats) => {
    if (err || stats.hasErrors()) {
        if (err) {
            console.error(err.stack || err);
            if (err.details) {
                console.error(err.details);
            }
            return;
        }        
    
        const info = stats.toJson();
    
        if (stats.hasErrors()) {
            console.error(info.errors);
            return;
        }
    
        if (stats.hasWarnings()) {
            console.warn(info.warnings);
        }
    }

    console.log(stats.toString({
        colors: true,
    }));
});
