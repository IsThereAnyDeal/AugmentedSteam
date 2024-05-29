
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
        "webRequest",
        "webRequestBlocking"
    ],
    host_permissions: [
        "*://*.steampowered.com/*",
        "*://steamcommunity.com/*",
        "*://*.isthereanydeal.com/"
    ],
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
    background: {
        service_worker: "js/background.js" // TODO service_worker not supported in Firefox
        // TODO, try code splitting and type: module
    }
};
