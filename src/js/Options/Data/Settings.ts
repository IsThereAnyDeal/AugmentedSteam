import Info from "@Core/Info";
import type {SettingsSchema} from "./_types";
import type {SchemaKeys, SchemaValue, StorageInterface} from "@Core/Storage/Storage";
import {SyncedStorage} from "@Core/Storage/SyncedStorage";

export const DefaultSettings: Readonly<SettingsSchema> = {
    language: "english",

    version: Info.version,
    version_show: true,

    highlight_owned_color: "#00ce67",
    highlight_wishlist_color: "#0491bf",
    highlight_coupon_color: "#a26426",
    highlight_inv_gift_color: "#800040",
    highlight_inv_guestpass_color: "#513c73",
    highlight_notinterested_color: "#4f4f4f",
    highlight_ignored_owned_color: "#4f4f4f",
    highlight_collection_color: "#856d0e",
    highlight_waitlist_color: "#4c7521",

    tag_owned_color: "#00b75b",
    tag_wishlist_color: "#0383b4",
    tag_coupon_color: "#c27120",
    tag_inv_gift_color: "#b10059",
    tag_inv_guestpass_color: "#65449a",
    tag_notinterested_color: "#4f4f4f",
    tag_ignored_owned_color: "#4f4f4f",
    tag_collection_color: "#856d0e",
    tag_waitlist_color: "#4c7521",

    highlight_owned: true,
    highlight_wishlist: true,
    highlight_coupon: false,
    highlight_inv_gift: false,
    highlight_inv_guestpass: false,
    highlight_notinterested: false,
    highlight_ignored_owned: false,
    highlight_excludef2p: false,
    highlight_collection: true,
    highlight_waitlist: true,

    tag_owned: false,
    tag_wishlist: false,
    tag_coupon: false,
    tag_inv_gift: false,
    tag_inv_guestpass: false,
    tag_notinterested: true,
    tag_ignored_owned: true,
    tag_collection: false,
    tag_waitlist: false,
    tag_short: false,

    hidetmsymbols: false,

    showlowestprice: true,
    showlowestprice_onwishlist: true,
    showlowestpricecoupon: true,
    showallstores: true,
    excluded_stores: [],
    override_price: "auto",
    showregionalprice: "mouse",
    regional_countries: ["us", "gb", "fr", "br", "au", "jp"],

    show_es_homepagetabs: true,
    showmarkettotal: false,
    showsteamrepapi: true,
    showmcus: true,
    showoc: true,
    showhltb: true,
    showyoutube: true,
    showtwitch: true,
    showpcgw: true,
    showcompletionistme: false,
    showprotondb: false,
    showviewinlibrary: false,
    showsteamcardexchange: false,
    showitadlinks: true,
    showsteamdb: true,
    showbartervg: false,
    showastatslink: true,
    showyoutubegameplay: true,
    showyoutubereviews: true,
    showwsgf: true,
    exfgls: true,
    app_custom_link: [
        {
            enabled: true,
            name: "Google",
            url: "https://www.google.com/search?q=[ID]+[NAME]",
            icon: "https://www.google.com/images/branding/product/ico/googleg_lodp.ico"
        },
    ],

    customize_apppage: {},
    customize_frontpage: {},

    show_package_info: false,
    show_players_info: true,
    show_early_access: true,
    show_alternative_linux_icon: false,
    show_itad_button: false,
    skip_got_steam: false,

    installsteam: "show",
    openinnewtab: false,
    keepssachecked: false,
    showemptywishlist: true,
    user_notes_app: true,
    user_notes_wishlist: true,
    showwishliststats: true,
    oneclickremovewl: false,
    user_notes_adapter: "synced_storage",
    showlanguagewarning: true,
    showlanguagewarninglanguage: "english",
    homepage_tab_selection: "remember",
    send_age_info: true,
    removebroadcasts: false,
    mp4video: false,
    horizontalscrolling: true,
    showsupportinfo: true,
    showdrm: true,
    regional_hideworld: false,
    showinvnav: true,
    quickinv: true,
    quickinv_diff: -0.01,
    community_default_tab: "",
    showallstats: true,
    replacecommunityhublinks: false,
    hideannouncementcomments: false,
    showachinstore: true,
    hideactivelistings: false,
    showlowestmarketprice: true,
    hidespamcomments: false,
    spamcommentregex: "[\\u2500-\\u25FF]",
    wlbuttoncommunityapp: true,
    removeguideslanguagefilter: false,
    confirmdeletecomment: true,
    disablelinkfilter: false,
    show1clickgoo: true,
    show_profile_link_images: "gray",
    show_custom_themes: true,
    profile_pinned_bg: false,
    friends_append_nickname: false,
    profile_steamrepcn: true,
    profile_steamgifts: true,
    profile_steamtrades: true,
    profile_bartervg: true,
    profile_steamrep: true,
    profile_steamdbcalc: true,
    profile_astats: true,
    profile_backpacktf: true,
    profile_astatsnl: true,
    profile_steamid: true,
    profile_custom_link: [
        {
            enabled: true,
            name: "Google",
            url: "https://www.google.com/search?q=[ID]",
            icon: "https://www.google.com/images/branding/product/ico/googleg_lodp.ico"
        },
    ],
    group_steamgifts: true,
    steamcardexchange: true,
    purchase_dates: true,
    show_badge_progress: true,
    show_coupon: true,
    show_wishlist_link: true,
    show_wishlist_count: true,
    show_progressbar: true,
    show_backtotop: false,

    profile_showcase_twitch: true,
    profile_showcase_own_twitch: false,
    profile_showcase_twitch_profileonly: false,

    itad_sync_library: true,
    itad_sync_wishlist: true,
    add_to_waitlist: false,
    collection_banner_notowned: false,
    itad_sync_notes: false,

    context_steam_store: false,
    context_steam_market: false,
    context_itad: false,
    context_bartervg: false,
    context_steamdb: false,
    context_steamdb_instant: false,
    context_steam_keys: false,
};


type TListener = () => void;

class Event {
    private listeners: Set<TListener> = new Set();

    addListener(listener: TListener): void {
        this.listeners.add(listener);
    }

    removeListener(listener: TListener): void {
        this.listeners.delete(listener);
    }

    invoke(): void {
        for (const listener of this.listeners) {
            listener();
        }
    }
}

export class SettingsStore {

    private static promise: Promise<void>;

    private static data: SettingsSchema;
    private static storage: StorageInterface<SettingsSchema> = new SyncedStorage<SettingsSchema>();

    public static readonly onSaveStart: Event = new Event();
    public static readonly onSaveEnd: Event = new Event();

    public static async load(): Promise<void> {
        this.data = await this.storage.getObject(DefaultSettings);
    }

    static init(): Promise<void> {
        if (!this.promise) {
            this.promise = this.load();
        }
        return this.promise;
    }

    static getDefault<K extends keyof SettingsSchema>(key: K): SettingsSchema[K] {
        return DefaultSettings[key];
    }

    static get<K extends keyof SettingsSchema>(key: K): SettingsSchema[K] {
        if (!this.data) {
            throw new Error("Settings have not been loaded");
        }

        return this.data[key];
    }

    static async set<K extends SchemaKeys<SettingsSchema>>(key: K, value: SchemaValue<SettingsSchema, K>): Promise<void> {
        this.onSaveStart.invoke();

        this.data[key] = value;
        await this.storage.set(key, value);

        this.onSaveEnd.invoke();
    }

    static remove<K extends SchemaKeys<SettingsSchema>>(key: K): void {
        this.storage.remove(key);
        this.data[key] = structuredClone(DefaultSettings[key]);
    }

    static clear(): void {
        this.storage.remove(...(Object.keys(this.data) as SchemaKeys<SettingsSchema>[]));
        this.data = structuredClone(DefaultSettings);
    }

    static async import(data: Partial<SettingsSchema>): Promise<void> {
        // TODO check data for valid keys and values
        await this.storage.setObject(data);
        await this.load();
    }

    static asObject(): SettingsSchema {
        return structuredClone(this.data);
    }
}

export default (new Proxy(SettingsStore, {
    get<K extends SchemaKeys<SettingsSchema>>(target: typeof SettingsStore, prop: K): SchemaValue<SettingsSchema, K> {
        return target.get(prop);
    },

    set<K extends SchemaKeys<SettingsSchema>>(target: typeof SettingsStore, prop: K, value: SchemaValue<SettingsSchema, K>): boolean {
        target.set(prop, value);
        return true;
    }
})) as unknown as SettingsSchema;


/*
 FIXME not settings, more like cached values
"user_notes": {},
"homepage_tab_last": null,
"sortfriendsby": "default_ASC",
"sortreviewsby": "default_ASC",
"sortgroupsby": "default_ASC",
"sortmylistingsby": "default_ASC",
"fav_emoticons": [],


const PERSISTENT: (keyof typeof DEFAULTS)[] = [
    "user_notes",
    "user_notes_adapter",
];
*/
