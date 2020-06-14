const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    "context": path.resolve(__dirname, "../.."),
    "entry": {
        "storefrontpage": "./src/js/content/store/storefront/PStoreFrontPage.js",
        "store": "./src/js/content/store.js",
        "background": "./src/js/background/background.js",
    },
    "plugins": [
        new CopyWebpackPlugin({
            "patterns": [
                {
                    "context": "./src/",
                    "from": "*/**",
                    "globOptions": {
                        "ignore": ["**/js/**"], // TODO Make this only ignore the top level js directory
                    } 
                },
                {
                    "context": "./src/js/",
                    "from": "lib/**",
                },
            ]
        }),
    ],
};
