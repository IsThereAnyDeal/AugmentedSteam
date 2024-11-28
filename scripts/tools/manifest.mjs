
export default {
    name: "Augmented Steam",
    short_name: "AS",
    description: "Augments your Steam Experience",
    icons: {
        128: "img/logo/as128.png",
        48: "img/logo/as48.png",
        32: "img/logo/as32.png"
    },
    manifest_version: 3,
    options_ui: {
        page: "html/options.html",
        open_in_tab: true
    },
    permissions: [
        "storage",
        "contextMenus",
        "webRequest"
    ],
    host_permissions: [
        "*://*.steampowered.com/*",
        "*://steamcommunity.com/*",
        "*://*.isthereanydeal.com/"
    ],
    optional_permissions: [],
    web_accessible_resources: [
        {
            resources: [
                "img/*",
                "css/*",
                "html/*",
                "scriptlets/*",
                "localization/*",
                "js/extra/holidayprofile.js",
                "changelog.json",
                "*.map",
            ],
            matches: [
                "*://*.steampowered.com/*",
                "*://steamcommunity.com/*",
            ]
        }
    ],
    homepage_url: "https://augmentedsteam.com/",
    background: {},
    content_scripts: [
        {
            matches: [
                "*://store.steampowered.com/*",
                "*://steamcommunity.com/*"
            ],
            js: [
                "scriptlets/SteamScriptlet.js"
            ],
            run_at: "document_start",
            world: "MAIN"
        }
    ]
};
