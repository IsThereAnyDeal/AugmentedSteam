import Settings from "@Options/Data/Settings";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import ITAD from "@Content/Modules/ITAD";
import InventoryApiFacade from "@Content/Modules/Facades/InventoryApiFacade";
import DOMHelper from "@Content/Modules/DOMHelper";
import Tags from "@Content/Modules/Highlights/Tags.svelte";
import type GameId from "@Core/GameId/GameId";

export const enum EHighlightStyle {
    BgGradient,
    BgColor,
    Outline
}

export interface Options {
    owned: boolean,
    wishlisted: boolean,
    ignored: boolean,
    ignoredOwned: boolean,
    collected: boolean,
    waitlisted: boolean,
    gift: boolean,
    guestPass: boolean,
    coupon: boolean,
}

export type ItemSetup = {
    h?: Array<keyof Options>,
    t?: Array<keyof Options>
}|null

export default class HighlightsTagsUtils2 {

    private readonly settings: Options;
    private readonly cache: Map<string, ItemSetup>;

    private tagsComponents: Tags[] = [];

    constructor(options: Partial<Options> = {}) {
        let settings: Options = {
            owned:        Settings.highlight_owned         || Settings.tag_owned,
            wishlisted:   Settings.highlight_wishlist      || Settings.tag_wishlist,
            ignored:      Settings.highlight_notinterested || Settings.tag_notinterested,
            ignoredOwned: Settings.highlight_ignored_owned || Settings.tag_ignored_owned,
            collected:    Settings.highlight_collection    || Settings.tag_collection,
            waitlisted:   Settings.highlight_waitlist      || Settings.tag_waitlist,
            gift:         Settings.highlight_inv_gift      || Settings.tag_inv_gift,
            guestPass:    Settings.highlight_inv_guestpass || Settings.tag_inv_guestpass,
            coupon:       Settings.highlight_coupon        || Settings.tag_coupon,
        }

        for (let [key, value] of Object.entries(options) as Array<[keyof Options, boolean]>) {
            settings[key] &&= value;
        }

        this.settings = settings;
        this.cache = new Map();
    }

    public isEnabled(): boolean {
        return Object.values(this.settings).some(x => x);
    }

    public insertStyles(): void {

        /*
         * NOTE: the sequence of these entries determines the precendence of the highlights!
         * The later it appears in the array, the higher its precedence
         */
        const colors: Record<keyof Options, string> = {
            ignoredOwned: Settings.highlight_ignored_owned_color,
            ignored:      Settings.highlight_notinterested_color,
            waitlisted:   Settings.highlight_waitlist_color,
            wishlisted:   Settings.highlight_wishlist_color,
            collected:    Settings.highlight_collection_color,
            owned:        Settings.highlight_owned_color,
            coupon:       Settings.highlight_coupon_color,
            guestPass:    Settings.highlight_inv_guestpass_color,
            gift:         Settings.highlight_inv_gift_color,
        };

        const css = [];
        for (const [name, color] of Object.entries(colors)) {
            css.push(
                `.ash-${name}-bg {
                    background: ${color} linear-gradient(135deg, rgba(0, 0, 0, 0.70) 10%, rgba(0, 0, 0, 0) 100%) !important;
                }
                .ash-${name}-outline {
                    outline: solid ${color};
                }
                .ash-${name}-bg-color {
                    background: none !important; color: ${color};
                }`
            );
        }

        DOMHelper.insertCSS(css.join("\n"));
    }

    public async query(ids: GameId[]): Promise<Map<string, ItemSetup>> {
        const result: Map<string, ItemSetup> = new Map();

        if (ids.length === 0) {
            return result;
        }

        let query: GameId[] = [];

        for(let id of ids) {
            if (this.cache.has(id.string)) {
                result.set(id.string, this.cache.get(id.string)!);
            } else {
                query.push(id);
            }
        }

        if (query.length > 0) {
            const storeIds = query.map(id => id.string);
            const appids = query.filter(id => id.type === "app").map(id => id.number);

            const settings = this.settings;
            const includeDsInfo = settings.owned || settings.wishlisted || settings.ignored || settings.ignoredOwned;
            const dsStatus = includeDsInfo
                ? await DynamicStore.getAppsStatus(storeIds)
                : {
                    ignored: new Set<string>(),
                    ignoredOwned: new Set<string>(),
                    owned: new Set<string>(),
                    wishlisted: new Set<string>()
                };

            const [inCollection, inWaitlist] = await Promise.all([
                settings.collected ?
                    ITAD.getInCollection(storeIds)
                    : Promise.resolve(new Set<string>()),
                settings.waitlisted
                    ? ITAD.getInWaitlist(storeIds)
                    : Promise.resolve(new Set<string>())
            ]);

            const [
                invGiftAppids,
                invPassAppids,
                invCouponAppids
            ] = await Promise.all([
                settings.gift
                    ? InventoryApiFacade.getGiftsAppids(appids)
                    : Promise.resolve(new Set<string>()),
                settings.guestPass
                    ? InventoryApiFacade.getPassesAppids(appids)
                    : Promise.resolve(new Set<string>()),
                settings.coupon
                    ? InventoryApiFacade.getCouponsAppids(appids)
                    : Promise.resolve(new Set<string>())
            ]);


            for (const id of ids) {
                const storeId = id.string;
                let high: Array<keyof Options> = [];
                let tags: Array<keyof Options> = [];

                if (settings.owned && dsStatus.owned.has(storeId)) {
                    if (Settings.highlight_owned) { high.push("owned"); }
                    if (Settings.tag_owned)       { tags.push("owned"); }
                }

                if (settings.wishlisted && dsStatus.wishlisted.has(storeId)) {
                    if (Settings.highlight_wishlist) { high.push("wishlisted"); }
                    if (Settings.tag_wishlist)       { tags.push("wishlisted"); }
                }

                if (settings.ignored && dsStatus.ignored.has(storeId)) {
                    if (Settings.highlight_notinterested) { high.push("ignored"); }
                    if (Settings.tag_notinterested)       { tags.push("ignored"); }
                }

                if (settings.ignoredOwned && dsStatus.ignoredOwned.has(storeId)) {
                    if (Settings.highlight_ignored_owned) { high.push("ignoredOwned"); }
                    if (Settings.tag_ignored_owned)       { tags.push("ignoredOwned"); }
                }

                if (inCollection.has(storeId)) {
                    if (Settings.highlight_collection) { high.push("collected"); }
                    if (Settings.tag_collection)       { tags.push("collected"); }
                }

                if (inWaitlist.has(storeId)) {
                    if (Settings.highlight_waitlist) { high.push("waitlisted"); }
                    if (Settings.tag_waitlist)       { tags.push("waitlisted"); }
                }

                if (invGiftAppids.has(storeId)) {
                    if (Settings.highlight_inv_gift) { high.push("gift"); }
                    if (Settings.tag_inv_gift)       { tags.push("gift"); }
                }

                if (invPassAppids.has(storeId)) {
                    if (Settings.highlight_inv_guestpass) { high.push("guestPass"); }
                    if (Settings.tag_inv_guestpass)       { tags.push("guestPass"); }
                }

                if (invCouponAppids.has(storeId)) {
                    if (Settings.highlight_coupon) { high.push("coupon"); }
                    if (Settings.tag_coupon)       { tags.push("coupon"); }
                }

                let setup: ItemSetup = null;
                if (high.length > 0) {
                    setup ??= {};
                    setup.h = high;
                }
                if (tags.length > 0) {
                    setup ??= {};
                    setup.t = tags;
                }

                result.set(storeId, setup);
                this.cache.set(storeId, setup);
            }
        }

        return result;
    }

    public highlight(options: Array<keyof Options>, style: EHighlightStyle, node: HTMLElement): void {
        if (options.length === 0) {
            return;
        }

        let suffix = "";
        switch(style) {
            case EHighlightStyle.BgGradient: suffix = "bg";       break;
            case EHighlightStyle.BgColor:    suffix = "bg-color"; break;
            case EHighlightStyle.Outline:    suffix = "outline";  break;
        }

        for (const option of options) {
            node.classList.add(`ash-${option}-${suffix}`);
        }
    }

    public tags(
        options: Array<keyof Options>,
        target: HTMLElement,
        anchor: HTMLElement|undefined=undefined
    ): void {
        if (options.length === 0) {
            return;
        }

        if (target.querySelector(".as-tags")) {
            return;
        }

        const tags = new Tags({
            target,
            anchor,
            props: {options}
        });

        this.tagsComponents.push(tags);
    }

    public clearDisconnectedTags(): void {
        this.tagsComponents = this.tagsComponents.filter(tags => {
            const connected = tags.isConnected();
            if (!connected) {
                tags.$destroy();
            }
            return connected;
        })
    }
}
