
type TColor = string;
type TShopId = number;
export type TCustomLink = {
    enabled: boolean,
    name: string,
    url: string,
    icon: string
};

export interface SettingsSchema {
    language: string,

    version: string,
    version_show: boolean,

    highlight_owned_color: TColor,
    highlight_wishlist_color: TColor,
    highlight_coupon_color: TColor,
    highlight_inv_gift_color: TColor,
    highlight_inv_guestpass_color: TColor,
    highlight_notinterested_color: TColor,
    highlight_ignored_owned_color: TColor,
    highlight_collection_color: TColor,
    highlight_waitlist_color: TColor,

    tag_owned_color: TColor,
    tag_wishlist_color: TColor,
    tag_coupon_color: TColor,
    tag_inv_gift_color: TColor,
    tag_inv_guestpass_color: TColor,
    tag_notinterested_color: TColor,
    tag_ignored_owned_color: TColor,
    tag_collection_color: TColor,
    tag_waitlist_color: TColor,

    highlight_owned: boolean,
    highlight_wishlist: boolean,
    highlight_coupon: boolean,
    highlight_inv_gift: boolean,
    highlight_inv_guestpass: boolean,
    highlight_notinterested: boolean,
    highlight_ignored_owned: boolean,
    highlight_excludef2p: boolean,
    highlight_collection: boolean,
    highlight_waitlist: boolean,

    tag_owned: boolean,
    tag_wishlist: boolean,
    tag_coupon: boolean,
    tag_inv_gift: boolean,
    tag_inv_guestpass: boolean,
    tag_notinterested: boolean,
    tag_ignored_owned: boolean,
    tag_collection: boolean,
    tag_waitlist: boolean,
    tag_short: boolean,

    hidetmsymbols: boolean,

    showlowestprice: boolean,
    showlowestprice_onwishlist: boolean,
    showlowestpricecoupon: boolean,
    showallstores: boolean,
    excluded_stores: TShopId[],
    override_price: "auto"|string,
    showregionalprice: "mouse"|"always"|"off",
    regional_countries: string[],

    show_es_homepagetabs: boolean,
    showmarkettotal: boolean,
    showsteamrepapi: boolean,
    showmcus: boolean,
    showoc: boolean,
    showhltb: boolean,
    showyoutube: boolean,
    showtwitch: boolean,
    showpcgw: boolean,
    showcompletionistme: boolean,
    showprotondb: boolean,
    showviewinlibrary: boolean,
    showsteamcardexchange: boolean,
    showitadlinks: boolean,
    showsteamdb: boolean,
    showbartervg: boolean,
    showastatslink: boolean,
    showyoutubegameplay: boolean,
    showyoutubereviews: boolean,
    showwsgf: boolean,
    exfgls: boolean,
    app_custom_link: Array<TCustomLink>,

    customize_apppage: Record<string, boolean>,
    customize_frontpage: Record<string, boolean>,

    show_package_info: boolean,
    show_players_info: boolean,
    show_early_access: boolean,
    show_alternative_linux_icon: boolean,
    show_itad_button: boolean,
    skip_got_steam: boolean,

    installsteam: "show"|"hide"|"replace",
    openinnewtab: boolean,
    keepssachecked: boolean,
    showemptywishlist: boolean,
    user_notes_app: boolean,
    user_notes_wishlist: boolean,
    showwishliststats: boolean,
    oneclickremovewl: boolean,
    user_notes_adapter: "synced_storage"|"idb",
    showlanguagewarning: boolean,
    showlanguagewarninglanguage: string,
    homepage_tab_selection:
        "remember"
        | "tab_newreleases_content_trigger"
        | "tab_topsellers_content_trigger"
        | "tab_upcoming_content_trigger"
        | "tab_specials_content_trigger"
        | "tab_trendingfree_content_trigger",
    send_age_info: boolean,
    removebroadcasts: boolean,
    mp4video: boolean,
    horizontalscrolling: boolean,
    showsupportinfo: boolean,
    showdrm: boolean,
    regional_hideworld: boolean,
    showinvnav: boolean,
    quickinv: boolean,
    quickinv_diff: number,
    community_default_tab:
        ""
        | "discussions"
        | "screenshots"
        | "images"
        | "broadcasts"
        | "videos"
        | "workshop"
        | "allnews"
        | "guides"
        | "reviews",
    showallstats: boolean,
    replacecommunityhublinks: boolean,
    hideannouncementcomments: boolean,
    showachinstore: boolean,
    hideactivelistings: boolean,
    showlowestmarketprice: boolean,
    hidespamcomments: boolean,
    spamcommentregex: string,
    wlbuttoncommunityapp: boolean,
    removeguideslanguagefilter: boolean,
    confirmdeletecomment: boolean,
    disablelinkfilter: boolean,
    show1clickgoo: boolean,
    show_profile_link_images: "gray" | "color" | "none",
    show_custom_themes: boolean,
    profile_pinned_bg: boolean,
    friends_append_nickname: boolean,
    profile_steamrepcn: boolean,
    profile_steamgifts: boolean,
    profile_steamtrades: boolean,
    profile_bartervg: boolean,
    profile_steamrep: boolean,
    profile_steamdbcalc: boolean,
    profile_astats: boolean,
    profile_backpacktf: boolean,
    profile_astatsnl: boolean,
    profile_steamid: boolean,
    profile_custom_link: Array<TCustomLink>,
    group_steamgifts: boolean,
    steamcardexchange: boolean,
    purchase_dates: boolean,
    show_badge_progress: boolean,
    show_coupon: boolean,
    show_wishlist_link: boolean,
    show_wishlist_count: boolean,
    show_progressbar: boolean,
    show_backtotop: boolean,

    profile_showcase_twitch: boolean,
    profile_showcase_own_twitch: boolean,
    profile_showcase_twitch_profileonly: boolean,

    itad_sync_library: boolean,
    itad_sync_wishlist: boolean,
    add_to_waitlist: boolean,
    collection_banner_notowned: boolean,
    itad_sync_notes: boolean,

    context_steam_store: boolean,
    context_steam_market: boolean,
    context_itad: boolean,
    context_bartervg: boolean,
    context_steamdb: boolean,
    context_steamdb_instant: boolean,
    context_steam_keys: boolean,
}
