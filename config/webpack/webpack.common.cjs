const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    "context": path.resolve(__dirname, "../../"),
    "entry": {
        "background": "./src/js/background/background.js",
        "storedefault": "./src/js/content/store/PDefaultStore.js",
        "storefrontpage": "./src/js/content/store/storefront/PStoreFrontPage.js",
    },
    "output": {
        "filename": "entries/[name].js",
    },
    "plugins": [
        new CopyWebpackPlugin({
            "patterns": [
                {
                    "context": "src/",
                    "from": "*/**",
                    "globOptions": {
                        "ignore": ["**/js/**"], // TODO Make this only ignore the top level js directory
                    } 
                },
                {
                    "context": "src/js/",
                    "from": "lib/**",
                },
            ]
        }),
    ],
};
