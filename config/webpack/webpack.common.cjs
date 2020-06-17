const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    "context": path.resolve(__dirname, "../../"),
    "entry": {
        "background": "./src/js/background/background.js",
        "store/default.js": "./src/js/content/store/PDefaultStore.js",
        "store/frontpage.js": "./src/js/content/store/storefront/PStoreFrontPage.js",
        "store/sale.js": "./src/js/content/store/sale/PSalePage.js",
        "store/search.js": "./src/js/content/store/search/PSearchPage.js",
        "store/stats.js": "./src/js/content/store/stats/PStatsPage.js",
        "store/wishlist.js": "./src/js/content/store/wishlist/PWishlistPage.js",
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
