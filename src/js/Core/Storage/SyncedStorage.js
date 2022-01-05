import {Storage} from "./Storage";
import {Info} from "../Info";

/*
 * browser.storage.sync limits
 * QUOTA_BYTES = 102400 // 100KB
 * QUOTA_BYTES_PER_ITEM = 8192 // 8KB
 * MAX_ITEMS = 512
 * MAX_WRITE_OPERATIONS_PER_HOUR = 1800
 * MAX_WRITE_OPERATIONS_PER_MINUTE = 120
 */
class SyncedStorage extends Storage {}

SyncedStorage._adapter = browser.storage.sync || browser.storage.local;

/*
 * 8KiB is the limit for storage.sync https://chromium.googlesource.com/chromium/src/+/refs/heads/main/extensions/common/api/storage.json#227
 * 5MiB is the limit for storage.local (overall size) https://chromium.googlesource.com/chromium/src/+/refs/heads/main/extensions/common/api/storage.json#227
 * 2KiB are subtracted in order to save some space for other configuration options
 */
SyncedStorage.QUOTA_BYTES_PER_ITEM = browser.storage.sync ? 8192 : 5242880 - 2048;

SyncedStorage.defaults = Object.freeze({
    "language": "english",

    "version": Info.version,
    "version_show": true,

    "highlight_owned_color": "#00ce67",
    "highlight_wishlist_color": "#0491bf",
    "highlight_coupon_color": "#a26426",
    "highlight_inv_gift_color": "#800040",
    "highlight_inv_guestpass_color": "#513c73",
    "highlight_notinterested_color": "#4f4f4f",
    "highlight_collection_color": "#856d0e",
    "highlight_waitlist_color": "#4c7521",

    "tag_owned_color": "#00b75b",
    "tag_wishlist_color": "#0383b4",
    "tag_coupon_color": "#c27120",
    "tag_inv_gift_color": "#b10059",
    "tag_inv_guestpass_color": "#65449a",
    "tag_notinterested_color": "#4f4f4f",
    "tag_collection_color": "#856d0e",
    "tag_waitlist_color": "#4c7521",

    "highlight_owned": true,
    "highlight_wishlist": true,
    "highlight_coupon": false,
    "highlight_inv_gift": false,
    "highlight_inv_guestpass": false,
    "highlight_notinterested": false,
    "highlight_excludef2p": false,
    "highlight_collection": true,
    "highlight_waitlist": true,

    "tag_owned": false,
    "tag_wishlist": false,
    "tag_coupon": false,
    "tag_inv_gift": false,
    "tag_inv_guestpass": false,
    "tag_notinterested": true,
    "tag_collection": false,
    "tag_waitlist": false,
    "tag_short": false,

    "hidetmsymbols": false,

    "showlowestprice": true,
    "showlowestprice_onwishlist": true,
    "showlowestpricecoupon": true,
    "showallstores": true,
    "stores": [],
    "override_price": "auto",
    "showregionalprice": "mouse",
    "regional_countries": ["us", "gb", "ru", "br", "au", "jp"],

    "show_es_homepagetabs": true,
    "showmarkettotal": false,
    "showsteamrepapi": true,
    "showmcus": true,
    "showoc": true,
    "showhltb": true,
    "showyoutube": true,
    "showtwitch": true,
    "showpcgw": true,
    "showcompletionistme": false,
    "showprotondb": false,
    "showviewinlibrary": false,
    "showsteamcardexchange": false,
    "showitadlinks": true,
    "showsteamdb": true,
    "showbartervg": false,
    "showastatslink": true,
    "showyoutubegameplay": true,
    "showyoutubereviews": true,
    "showwsgf": true,
    "exfgls": true,
    "app_custom_link": [
        {
            "enabled": false,
            "name": "Google",
            "url": "google.com/search?q=[ID]+[NAME]",
            "icon": "www.google.com/images/branding/product/ico/googleg_lodp.ico"
        },
    ],

    "customize_apppage": {
        "recentupdates": true,
        "reviews": true,
        "about": true,
        "contentwarning": true,
        "steamchart": true,
        "steamspy": true,
        "surveys": true,
        "sysreq": true,
        "legal": true,
        "morelikethis": true,
        "recommendedbycurators": true,
        "customerreviews": true
    },

    "customize_frontpage": {
        "featuredrecommended": true,
        "specialoffers": true,
        "trendingamongfriends": true,
        "discoveryqueue": true,
        "browsesteam": true,
        "curators": true,
        "morecuratorrecommendations": true,
        "recentlyupdated": true,
        "fromdevelopersandpublishersthatyouknow": true,
        "popularvrgames": true,
        "homepagetabs": true,
        "gamesstreamingnow": true,
        "under": true,
        "updatesandoffers": true,
        "homepagesidebar": true
    },

    // 'show_keylol_links': false, // not in use, option is commented out
    "show_package_info": false,
    "show_steamchart_info": true,
    "show_steamspy_info": true,
    "show_early_access": true,
    "show_alternative_linux_icon": false,
    "show_itad_button": false,
    "skip_got_steam": false,

    "installsteam": "show",
    "openinnewtab": false,
    "keepssachecked": false,
    "showemptywishlist": true,
    "user_notes_app": true,
    "user_notes_wishlist": true,
    "user_notes_app_color": "#c6d4df",
    "user_notes_wishlist_color": "#5fafdd",
    "showwishliststats": true,
    "oneclickremovewl": false,
    "user_notes": {},
    "user_notes_adapter": "synced_storage",
    "replaceaccountname": true,
    "showlanguagewarning": true,
    "showlanguagewarninglanguage": "english",
    "homepage_tab_selection": "remember",
    "homepage_tab_last": null,
    "send_age_info": true,
    "removebroadcasts": false,
    "mp4video": false,
    "horizontalscrolling": true,
    "showsupportinfo": true,
    "showdrm": true,
    "regional_hideworld": false,
    "showinvnav": true,
    "quickinv": true,
    "quickinv_diff": -0.01,
    "community_default_tab": "",
    "showallachievements": false,
    "showallstats": true,
    "replacecommunityhublinks": false,
    "showachinstore": true,
    "hideactivelistings": false,
    "showlowestmarketprice": true,
    "hidespamcomments": false,
    "spamcommentregex": "[\\u2500-\\u25FF]",
    "wlbuttoncommunityapp": true,
    "removeguideslanguagefilter": false,
    "disablelinkfilter": false,
    "sortfriendsby": "default_ASC",
    "sortreviewsby": "default_ASC",
    "sortgroupsby": "default_ASC",
    "show1clickgoo": true,
    "show_profile_link_images": "gray",
    "show_custom_themes": true,
    "profile_pinned_bg": false,
    "profile_steamrepcn": true,
    "profile_steamgifts": true,
    "profile_steamtrades": true,
    "profile_bartervg": true,
    "profile_steamrep": true,
    "profile_steamdbcalc": true,
    "profile_astats": true,
    "profile_backpacktf": true,
    "profile_astatsnl": true,
    "profile_steamid": true,
    "profile_custom_link": [
        {
            "enabled": true,
            "name": "Google",
            "url": "google.com/search?q=[ID]",
            "icon": "www.google.com/images/branding/product/ico/googleg_lodp.ico"
        },
    ],
    "fav_emoticons": [],
    "group_steamgifts": true,
    "steamcardexchange": true,
    "purchase_dates": true,
    "show_badge_progress": true,
    "show_coupon": true,
    "show_wishlist_link": true,
    "show_wishlist_count": true,
    "show_progressbar": true,
    "show_backtotop": false,

    "profile_showcase_twitch": true,
    "profile_showcase_own_twitch": false,
    "profile_showcase_twitch_profileonly": false,

    "itad_import_library": false,
    "itad_import_wishlist": false,
    "add_to_waitlist": false,

    "context_steam_store": false,
    "context_steam_market": false,
    "context_itad": false,
    "context_bartervg": false,
    "context_steamdb": false,
    "context_steamdb_instant": false,
    "context_steam_keys": false,
});
SyncedStorage.persistent = [
    "user_notes",
    "user_notes_adapter",
];

export {SyncedStorage};
