const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require("path");

const rootDir = path.resolve(__dirname, "../../");

module.exports = {
    "context": rootDir,
    "entry": {
        "background": "./src/js/background/background.js",
        "options": "./src/js/options/options.js",
        "community/badges": "./src/js/content/community/badges/PBadgesPage.js",
        "community/default": "./src/js/content/community/PDefaultCommunity.js",
        "community/friends": "./src/js/content/community/friends/PFriendsPage.js",
        "community/friends_that_play": "./src/js/content/community/friends_that_play/PFriendsThatPlayPage.js",
        "community/gamecard": "./src/js/content/community/gamecard/PGameCardPage.js",
        "community/games": "./src/js/content/community/games/PGamesPage.js",
        "community/groups": "./src/js/content/community/groups/PGroupsPage.js",
        "community/inventory": "./src/js/content/community/inventory/PInventoryPage.js",
        "community/market_listing": "./src/js/content/community/market_listing/PMarketListingPage.js",
        "community/profile_activity": "./src/js/content/community/profile_activity/PProfileActivityPage.js",
        "community/profile_edit": "./src/js/content/community/profile_edit/PProfileEditPage.js",
        "community/workshop": "./src/js/content/community/workshop/PWorkshopPage.js",
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
        "modules": [path.resolve(rootDir, "src/js/"), path.resolve(rootDir, "src/js/content/"), path.resolve(rootDir, "node_modules/")],
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
