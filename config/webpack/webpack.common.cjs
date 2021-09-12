const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MiniCssExtractCleanupPlugin = require("./Plugins/MiniCssExtractCleanupPlugin.cjs");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");

const rootDir = path.resolve(__dirname, "../../");

module.exports = {
    "context": rootDir,
    "entry": {
        // stylesheets - NOTE: main stylesheet added during build, based on browser
        "css/community/tradeoffer": "./src/css/community/tradeoffer.css",
        "css/options": "./src/css/options.css",
        // pages
        "js/background": "./src/js/Background/background.js",
        "js/options": "./src/js/Options/options.js",
        "js/community/app": "./src/js/Content/Features/Community/App/PApp.js",
        "js/community/badges": "./src/js/Content/Features/Community/Badges/PBadges.js",
        "js/community/booster_creator": "./src/js/Content/Features/Community/BoosterCreator/PBoosterCreator.js",
        "js/community/default": "./src/js/Content/Features/Community/PDefaultCommunity.js",
        "js/community/edit_guide": "./src/js/Content/Features/Community/EditGuide/PEditGuide.js",
        "js/community/friends_and_groups": "./src/js/Content/Features/Community/FriendsAndGroups/PFriendsAndGroups.js",
        "js/community/friends_that_play": "./src/js/Content/Features/Community/FriendsThatPlay/PFriendsThatPlay.js",
        "js/community/gamecard": "./src/js/Content/Features/Community/GameCard/PGameCard.js",
        "js/community/games": "./src/js/Content/Features/Community/Games/PGames.js",
        "js/community/group_home": "./src/js/Content/Features/Community/GroupHome/PGroupHome.js",
        "js/community/guides": "./src/js/Content/Features/Community/Guides/PGuides.js",
        "js/community/inventory": "./src/js/Content/Features/Community/Inventory/PInventory.js",
        "js/community/market": "./src/js/Content/Features/Community/Market/PMarket.js",
        "js/community/market_listing": "./src/js/Content/Features/Community/MarketListing/PMarketListing.js",
        "js/community/myworkshop": "./src/js/Content/Features/Community/MyWorkshop/PMyWorkshop.js",
        "js/community/profile_activity": "./src/js/Content/Features/Community/ProfileActivity/PProfileActivity.js",
        "js/community/profile_edit": "./src/js/Content/Features/Community/ProfileEdit/PProfileEdit.js",
        "js/community/profile_home": "./src/js/Content/Features/Community/ProfileHome/PProfileHome.js",
        "js/community/recommended": "./src/js/Content/Features/Community/Recommended/PRecommended.js",
        "js/community/shared_files": "./src/js/Content/Features/Community/SharedFiles/PSharedFiles.js",
        "js/community/stats": "./src/js/Content/Features/Community/Stats/PStats.js",
        "js/community/trade_offer": "./src/js/Content/Features/Community/TradeOffer/PTradeOffer.js",
        "js/community/workshop": "./src/js/Content/Features/Community/Workshop/PWorkshop.js",
        "js/community/workshop_browse": "./src/js/Content/Features/Community/WorkshopBrowse/PWorkshopBrowse.js",
        "js/store/account": "./src/js/Content/Features/Store/Account/PAccount.js",
        "js/store/agecheck": "./src/js/Content/Features/Store/AgeCheck/PAgecheck.js",
        "js/store/app": "./src/js/Content/Features/Store/App/PApp.js",
        "js/store/bundle": "./src/js/Content/Features/Store/Bundle/PBundle.js",
        "js/store/default": "./src/js/Content/Features/Store/PDefaultStore.js",
        "js/store/frontpage": "./src/js/Content/Features/Store/Storefront/PStoreFront.js",
        "js/store/funds": "./src/js/Content/Features/Store/Funds/PFunds.js",
        "js/store/registerkey": "./src/js/Content/Features/Store/RegisterKey/PRegisterKey.js",
        "js/store/sale": "./src/js/Content/Features/Store/Sale/PSale.js",
        "js/store/search": "./src/js/Content/Features/Store/Search/PSearch.js",
        "js/store/stats": "./src/js/Content/Features/Store/Stats/PStats.js",
        "js/store/sub": "./src/js/Content/Features/Store/Sub/PSub.js",
        "js/store/wishlist": "./src/js/Content/Features/Store/Wishlist/PWishlist.js",
        "js/extra/holidayprofile": "./src/js/Steam/holidayprofile.js"
    },
    "output": {
        "path": `${rootDir}/dist`,
        "filename": "[name].js",
    },
    "resolve": {
        "modules": [
            path.resolve(rootDir, "src/js/"),
            path.resolve(rootDir, "src/js/Content/Features/"),
            path.resolve(rootDir, "node_modules/")
        ],
    },
    "module": {
        "rules": [
            {
                "test": /\.css$/,
                "use": [MiniCssExtractPlugin.loader, {
                    "loader": "css-loader",
                    "options": {
                        "url": false
                    }
                }],
            },
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
                        "ignore": [
                            "**/js/**", // TODO Make this only ignore the top level js directory
                            "**/css/**"
                        ],
                    }
                },
                {
                    "from": "node_modules/webextension-polyfill/dist/browser-polyfill.js",
                    "to": "js/browser-polyfill.js"
                },
                {
                    "from": "node_modules/dompurify/dist/purify.js",
                    "to": "js/dompurify.js"
                },
                "LICENSE",
            ]
        }),
        new MiniCssExtractPlugin({
            "filename": "[name].css",
            "options": {
                "url": false
            }
        }),
        new MiniCssExtractCleanupPlugin()
    ],
    "optimization": {
        "minimizer": [
            "...",
            new JsonMinimizerPlugin(),
            new CssMinimizerPlugin(),
        ],
    },
};
