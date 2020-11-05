const webpack = require("webpack");
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
        "authorization": "./src/js/Background/authorization.js",
        "background": "./src/js/Background/background.js",
        "options": "./src/js/options/options.js",
        "community/app": "./src/js/Content/Features/Community/App/PApp.js",
        "community/badges": "./src/js/Content/Features/Community/Badges/PBadges.js",
        "community/booster_creator": "./src/js/Content/Features/Community/BoosterCreator/PBoosterCreator.js",
        "community/default": "./src/js/Content/Features/Community/PDefaultCommunity.js",
        "community/edit_guide": "./src/js/Content/Features/Community/EditGuide/PEditGuide.js",
        "community/friends": "./src/js/Content/Features/Community/Friends/PFriends.js",
        "community/friends_that_play": "./src/js/Content/Features/Community/FriendsThatPlay/PFriendsThatPlay.js",
        "community/gamecard": "./src/js/Content/Features/Community/GameCard/PGameCard.js",
        "community/games": "./src/js/Content/Features/Community/Games/PGames.js",
        "community/group_home": "./src/js/Content/Features/Community/GroupHome/PGroupHome.js",
        "community/groups": "./src/js/Content/Features/Community/Groups/PGroups.js",
        "community/guides": "./src/js/Content/Features/Community/Guides/PGuides.js",
        "community/inventory": "./src/js/Content/Features/Community/Inventory/PInventory.js",
        "community/market": "./src/js/Content/Features/Community/Market/PMarket.js",
        "community/market_listing": "./src/js/Content/Features/Community/MarketListing/PMarketListing.js",
        "community/myworkshop": "./src/js/Content/Features/Community/MyWorkshop/PMyWorkshop.js",
        "community/profile_activity": "./src/js/Content/Features/Community/ProfileActivity/PProfileActivity.js",
        "community/profile_edit": "./src/js/Content/Features/Community/ProfileEdit/PProfileEdit.js",
        "community/profile_home": "./src/js/Content/Features/Community/ProfileHome/PProfileHome.js",
        "community/recommended": "./src/js/Content/Features/Community/Recommended/PRecommended.js",
        "community/shared_files": "./src/js/Content/Features/Community/SharedFiles/PSharedFiles.js",
        "community/stats": "./src/js/Content/Features/Community/Stats/PStats.js",
        "community/trade_offer": "./src/js/Content/Features/Community/TradeOffer/PTradeOffer.js",
        "community/workshop": "./src/js/Content/Features/Community/Workshop/PWorkshop.js",
        "community/workshop_browse": "./src/js/Content/Features/Community/WorkshopBrowse/PWorkshopBrowse.js",
        "store/account": "./src/js/Content/Features/Store/Account/PAccount.js",
        "store/agecheck": "./src/js/Content/Features/Store/AgeCheck/PAgecheck.js",
        "store/app": "./src/js/Content/Features/Store/App/PApp.js",
        "store/bundle": "./src/js/Content/Features/Store/Bundle/PBundle.js",
        "store/default": "./src/js/Content/Features/Store/PDefaultStore.js",
        "store/frontpage": "./src/js/Content/Features/Store/Storefront/PStoreFront.js",
        "store/funds": "./src/js/Content/Features/Store/Funds/PFunds.js",
        "store/registerkey": "./src/js/Content/Features/Store/RegisterKey/PRegisterKey.js",
        "store/sale": "./src/js/Content/Features/Store/Sale/PSale.js",
        "store/search": "./src/js/Content/Features/Store/Search/PSearch.js",
        "store/stats": "./src/js/Content/Features/Store/Stats/PStats.js",
        "store/sub": "./src/js/Content/Features/Store/Sub/PSub.js",
        "store/wishlist": "./src/js/Content/Features/Store/Wishlist/PWishlist.js",
        "extra/holidayprofile": "./src/js/Steam/holidayprofile.js",
        // libs
        "browser-polyfill": {
            "import": "webextension-polyfill"
        },
        "dompurify": {
            "import": "dompurify",
        }
    },
    "output": {
        "path": `${rootDir}/dist`,
        "filename": "js/[name].js",
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
                "changelog.txt",
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
