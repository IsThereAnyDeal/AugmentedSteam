const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    "context": path.resolve(__dirname, "../../"),
    "entry": {
        "background": "./src/js/background/background.js",
        "store/account": "./src/js/content/store/account/PAccountPage.js",
        "store/bundle": "./src/js/content/store/bundle/PBundlePage.js",
        "store/default": "./src/js/content/store/PDefaultStore.js",
        "store/frontpage": "./src/js/content/store/storefront/PStoreFrontPage.js",
        "store/funds": "./src/js/content/store/funds/PFundsPage.js",
        "store/registerkey": "./src/js/content/store/registerkey/PRegisterKeyPage.js",
        "store/sale": "./src/js/content/store/sale/PSalePage.js",
        "store/search": "./src/js/content/store/search/PSearchPage.js",
        "store/stats": "./src/js/content/store/stats/PStatsPage.js",
        "store/wishlist": "./src/js/content/store/wishlist/PWishlistPage.js",
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
