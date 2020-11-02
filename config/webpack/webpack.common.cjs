const CopyWebpackPlugin = require("copy-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const path = require("path");

const rootDir = path.resolve(__dirname, "../../");

module.exports = {
    "context": rootDir,
    "entry": {
        "background": "./src/js/background/background.js",
        "options": "./src/js/options/options.js",
        "community/app": "./src/js/Content/Community/App/PApp.js",
        "community/badges": "./src/js/Content/Community/Badges/PBadges.js",
        "community/booster_creator": "./src/js/Content/Community/BoosterCreator/PBoosterCreator.js",
        "community/default": "./src/js/Content/Community/PDefaultCommunity.js",
        "community/edit_guide": "./src/js/Content/Community/EditGuide/PEditGuide.js",
        "community/friends": "./src/js/Content/Community/Friends/PFriends.js",
        "community/friends_that_play": "./src/js/Content/Community/FriendsThatPlay/PFriendsThatPlay.js",
        "community/gamecard": "./src/js/Content/Community/GameCard/PGameCard.js",
        "community/games": "./src/js/Content/Community/Games/PGames.js",
        "community/group_home": "./src/js/Content/Community/GroupHome/PGroupHome.js",
        "community/groups": "./src/js/Content/Community/Groups/PGroups.js",
        "community/guides": "./src/js/Content/Community/Guides/PGuides.js",
        "community/inventory": "./src/js/Content/Community/Inventory/PInventory.js",
        "community/market": "./src/js/Content/Community/Market/PMarket.js",
        "community/market_listing": "./src/js/Content/Community/MarketListing/PMarketListing.js",
        "community/myworkshop": "./src/js/Content/Community/MyWorkshop/PMyWorkshop.js",
        "community/profile_activity": "./src/js/Content/Community/ProfileActivity/PProfileActivity.js",
        "community/profile_edit": "./src/js/Content/Community/ProfileEdit/PProfileEdit.js",
        "community/profile_home": "./src/js/Content/Community/ProfileHome/PProfileHome.js",
        "community/recommended": "./src/js/Content/Community/Recommended/PRecommended.js",
        "community/shared_files": "./src/js/Content/Community/SharedFiles/PSharedFiles.js",
        "community/stats": "./src/js/Content/Community/Stats/PStats.js",
        "community/trade_offer": "./src/js/Content/Community/TradeOffer/PTradeOffer.js",
        "community/workshop": "./src/js/Content/Community/Workshop/PWorkshop.js",
        "community/workshop_browse": "./src/js/Content/Community/WorkshopBrowse/PWorkshopBrowse.js",
        "store/account": "./src/js/Content/Store/Account/PAccount.js",
        "store/agecheck": "./src/js/Content/Store/AgeCheck/PAgecheck.js",
        "store/app": "./src/js/Content/Store/App/PApp.js",
        "store/bundle": "./src/js/Content/Store/Bundle/PBundle.js",
        "store/default": "./src/js/Content/Store/PDefaultStore.js",
        "store/frontpage": "./src/js/Content/Store/Storefront/PStoreFront.js",
        "store/funds": "./src/js/Content/Store/Funds/PFunds.js",
        "store/registerkey": "./src/js/Content/Store/RegisterKey/PRegisterKey.js",
        "store/sale": "./src/js/Content/Store/Sale/PSale.js",
        "store/search": "./src/js/Content/Store/Search/PSearch.js",
        "store/stats": "./src/js/Content/Store/Stats/PStats.js",
        "store/sub": "./src/js/Content/Store/Sub/PSub.js",
        "store/wishlist": "./src/js/Content/Store/Wishlist/PWishlist.js",
    },
    "output": {
        "path": `${rootDir}/dist`,
        "filename": "entries/[name].js",
    },
    "resolve": {
        "modules": [
            path.resolve(rootDir, "src/js/"),
            path.resolve(rootDir, "src/js/Content/"),
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
