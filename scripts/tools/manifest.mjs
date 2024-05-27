
export default {
    name: "Augmented Steam",
    short_name: "AS",
    description: "Augments your Steam Experience",
    icons: {
        128: "img/logo/as128.png",
        48: "img/logo/as48.png",
        32: "img/logo/as32.png"
    },
    manifest_version: 2,
    options_ui: {
        page: "html/options.html",
        open_in_tab: true
    },
    permissions: [
        "storage",
        "*://*.steampowered.com/*",
        "*://steamcommunity.com/*",
        "*://*.isthereanydeal.com/",
        "webRequest",
        "webRequestBlocking"
    ],
    web_accessible_resources: [
        "img/*.png",
        "img/*.gif",
        "img/*.jpg",
        "img/*.svg",
        "css/*.css",
        "html/options.html",
        "img/*/*.png",
        "img/profile_styles/*/header.jpg",
        "img/profile_styles/*/showcase.png",
        "img/profile_styles/*/style.css",
        "img/profile_styles/*/preview.png",
        "localization/*.json",
        "js/extra/holidayprofile.js",
        "changelog.json",
        "*.map",
        "scriptlets/*"
    ],
    homepage_url: "https://augmentedsteam.com/",
    background: {
        persistent: true,
        scripts: [
            "js/background.js"
        ]
    }
};
