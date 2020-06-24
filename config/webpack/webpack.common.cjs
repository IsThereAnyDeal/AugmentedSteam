const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require("path");

const rootDir = path.resolve(__dirname, "../../");

module.exports = {
    "context": rootDir,
    "entry": {
        "background": "./src/js/background/background.js",
        "options": "./src/js/options/options.js",
        "store/account": "./src/js/content/store/account/PAccountPage.js",
        "store/agecheck": "./src/js/content/store/agecheck/PAgecheckPage.js",
        "store/app": "./src/js/content/store/app/PAppPage.js",
        "store/bundle": "./src/js/content/store/bundle/PBundlePage.js",
        "store/default": "./src/js/content/store/PDefaultStore.js",
        "store/frontpage": "./src/js/content/store/storefront/PStoreFrontPage.js",
        "store/funds": "./src/js/content/store/funds/PFundsPage.js",
        "store/registerkey": "./src/js/content/store/registerkey/PRegisterKeyPage.js",
        "store/sale": "./src/js/content/store/sale/PSalePage.js",
        "store/search": "./src/js/content/store/search/PSearchPage.js",
        "store/stats": "./src/js/content/store/stats/PStatsPage.js",
        "store/sub": "./src/js/content/store/sub/PSubPage.js",
        "store/wishlist": "./src/js/content/store/wishlist/PWishlistPage.js",
    },
    "output": {
        "filename": "entries/[name].js",
    },
    "resolve": {
        "modules": [path.resolve(rootDir, "src/js/"), path.resolve(rootDir, "src/js/content/")],
    },
    "plugins": [
        new CleanWebpackPlugin(),
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
                "changelog.txt",
                "LICENSE",
            ]
        }),
    ],
};
