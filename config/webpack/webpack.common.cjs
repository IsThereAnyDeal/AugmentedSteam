const CopyWebpackPlugin = require("copy-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const path = require("path");

const rootDir = path.resolve(__dirname, "../../");

module.exports = {
    "context": rootDir,
    "entry": {
        "background": "./src/js/background/background.js",
        "options": "./src/js/options/options.js",
        "community/app": "./src/js/content/community/app/PApp.js",
        "community/badges": "./src/js/content/community/badges/PBadges.js",
        "community/booster_creator": "./src/js/content/community/booster_creator/PBoosterCreator.js",
        "community/default": "./src/js/content/community/PDefaultCommunity.js",
        "community/edit_guide": "./src/js/content/community/edit_guide/PEditGuide.js",
        "community/friends": "./src/js/content/community/friends/PFriends.js",
        "community/friends_that_play": "./src/js/content/community/friends_that_play/PFriendsThatPlay.js",
        "community/gamecard": "./src/js/content/community/gamecard/PGameCard.js",
        "community/games": "./src/js/content/community/games/PGames.js",
        "community/group_home": "./src/js/content/community/group_home/PGroupHome.js",
        "community/groups": "./src/js/content/community/groups/PGroups.js",
        "community/guides": "./src/js/content/community/guides/PGuides.js",
        "community/inventory": "./src/js/content/community/inventory/PInventory.js",
        "community/market": "./src/js/content/community/market/PMarket.js",
        "community/market_listing": "./src/js/content/community/market_listing/PMarketListing.js",
        "community/myworkshop": "./src/js/content/community/myworkshop/PMyWorkshop.js",
        "community/profile_activity": "./src/js/content/community/profile_activity/PProfileActivity.js",
        "community/profile_edit": "./src/js/content/community/profile_edit/PProfileEdit.js",
        "community/profile_home": "./src/js/content/community/profile_home/PProfileHome.js",
        "community/recommended": "./src/js/content/community/recommended/PRecommended.js",
        "community/shared_files": "./src/js/content/community/shared_files/PSharedFiles.js",
        "community/stats": "./src/js/content/community/stats/PStats.js",
        "community/trade_offer": "./src/js/content/community/trade_offer/PTradeOffer.js",
        "community/workshop": "./src/js/content/community/workshop/PWorkshop.js",
        "community/workshop_browse": "./src/js/content/community/workshop_browse/PWorkshopBrowse.js",
        "store/account": "./src/js/content/store/account/PAccount.js",
        "store/agecheck": "./src/js/content/store/agecheck/PAgecheck.js",
        "store/app": "./src/js/content/store/app/PApp.js",
        "store/bundle": "./src/js/content/store/bundle/PBundle.js",
        "store/default": "./src/js/content/store/PDefaultStore.js",
        "store/frontpage": "./src/js/content/store/storefront/PStoreFront.js",
        "store/funds": "./src/js/content/store/funds/PFunds.js",
        "store/registerkey": "./src/js/content/store/registerkey/PRegisterKey.js",
        "store/sale": "./src/js/content/store/sale/PSale.js",
        "store/search": "./src/js/content/store/search/PSearch.js",
        "store/stats": "./src/js/content/store/stats/PStats.js",
        "store/sub": "./src/js/content/store/sub/PSub.js",
        "store/wishlist": "./src/js/content/store/wishlist/PWishlist.js",
    },
    "output": {
        "filename": "entries/[name].js",
    },
    "resolve": {
        "modules": [
            path.resolve(rootDir, "src/js/"),
            path.resolve(rootDir, "src/js/content/"),
            path.resolve(rootDir, "node_modules/")
        ],
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
                {
                    "context": "src/js/steam/",
                    "from": "**",
                    "to": "scripts/",
                },
                "changelog.txt",
                "LICENSE",
            ]
        }),
    ],
};
