import AppId from "@Core/GameId/AppId";
import SubId from "@Core/GameId/SubId";
import BundleId from "@Core/GameId/BundleId";
import {L} from "@Core/Localization/Localization";
import {
    __tag_collection,
    __tag_coupon,
    __tag_ignoredOwned,
    __tag_invGift,
    __tag_invGuestpass,
    __tag_notinterested,
    __tag_owned,
    __tag_waitlist,
    __tag_wishlist,
    __thewordunknown
} from "@Strings/_strings";
import Settings from "@Options/Data/Settings";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import ITAD from "@Content/Modules/ITAD";
import HTML from "@Core/Html/Html";
import DOMHelper from "../DOMHelper";
import InventoryApiFacade from "@Content/Modules/Facades/InventoryApiFacade";

type Options = {
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

/**
 * @deprecated
 */
export default class HighlightsTagsUtils {

    private static _highlightCssLoaded: boolean = false;
    private static _tagCssLoaded: boolean = false;

    // Note: select the node which has DS info, and traverse later when highlighting if needed
    private static readonly _selector = [
        ".tab_item", // Item rows on storefront
        ".newonsteam_headercap", // explore/new/
        ".comingsoon_headercap", // explore/upcoming/
        ".store_capsule",
        ".dailydeal_ctn",
        ".special.special_img_ctn", // explore/new, cart/
        ".special > .special_img_ctn",
        ".store_main_capsule", // Featured & Recommended
        ".home_marketing_message[data-ds-appid]", // Updates and Offers
        ".home_area_spotlight", // Special Offers, specials/
        ".curator_giant_capsule", // Curator Recommendations
        ".home_content_item", // Recommendations at the bottom of the storefront (small)
        ".home_content.single > .gamelink", // ...aforementioned (big)
        ".highlighted_app_header", // curators/
        "body.dlc_curator #curator_avatar_image", // Header image on dlc pages
        ".curator_featured .capsule", // Featured items on curator, developer, publisher, franchise, dlc etc. pages
        ".recommendation", // Item rows on aforementioned pages (the node to highlight and the parent of .store_capsule, and will get processed first)
        ".search_result_row",
        ".small_cap", // "recommended" section on app pages
        ".game_area_dlc_row", // DLC on app pages
        ".browse_tag_game", // tag/browse (the node to highlight)
        ".recommendation_highlight > .header_image", // recommended/morelike, recommended/friendactivity/
        ".similar_grid_item", // recommended/morelike
        ".friend_game_block > .game_capsule", // recommended/friendactivity/
        ".friendactivity_tab_row", // recommended/friendactivity/
        ".recommendation_app", // recommended/byfriends/
        ".recommendation_carousel_item",
        ".app_header",
        ".friendplaytime_appheader",
    ].join(",");

    static highlightTitle(appid: number): Promise<void> {

        const title = document.querySelector<HTMLElement>(".apphub_AppName");
        if (!title) {
            return Promise.resolve();
        }

        title.dataset.dsAppid = String(appid);

        return this.highlightAndTag([title]);
    }

    /**
     * Highlights and tags DOM nodes that are owned, wishlisted, ignored, collected, waitlisted
     * or that the user has a gift, a guest pass or coupon for.
     *
     * @param {NodeList|Array} nodes - The nodes that should get highlighted
     * (defaults to all known nodes that are highlightable and taggable)
     * @param {Object} options - Option overrides that should be applied
     * @returns {Promise} - Resolved once the highlighting and tagging completed for the nodes
     */
    static async highlightAndTag(
        nodes: NodeListOf<HTMLElement>|Array<HTMLElement>|undefined = undefined,
        options: Partial<Options> = {}): Promise<void> {

        const settings = {
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

        if (!Object.values(settings).some(x => x)) { return; }

        const _nodes = nodes ?? document.querySelectorAll(this._selector);
        if (_nodes.length === 0) { return; }

        const appids: number[] = [];
        const storeIdsMap: Map<string, HTMLElement[]> = new Map();

        for (const node of _nodes) {
            if (node.classList.contains("es_highlight_checked")) { continue; }
            node.classList.add("es_highlight_checked");

            const aNode = node.querySelector("a");

            let storeId: string|null = null;

            const appid = AppId.fromElement(node) ?? AppId.fromElement(aNode);
            if (appid) {
                storeId = `app/${appid}`;
                appids.push(appid)
            } else {
                const subid = SubId.fromElement(node) ?? SubId.fromElement(aNode);
                if (subid) {
                    storeId = `sub/${subid}`;
                } else {
                     const bundleid = BundleId.fromElement(node) ?? BundleId.fromElement(aNode);
                     if (bundleid) {
                         storeId = `bundle/${bundleid}`;
                     }
                }
            }

            if (storeId) {
                if (storeIdsMap.has(storeId)) {
                    storeIdsMap.get(storeId)!.push(node);
                } else {
                    storeIdsMap.set(storeId, [node]);
                }
            } else {
                console.warn("FHighlightsTags: Couldn't find storeId for node %o", node);
            }
        }

        const storeIds = Array.from(storeIdsMap.keys());
        if (storeIds.length === 0) { return; }

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


        const actions = {
            owned: <HTMLElement[]>[],
            wishlist: <HTMLElement[]>[],
            ignored: <HTMLElement[]>[],
            ignoredOwned: <HTMLElement[]>[],
            collection: <HTMLElement[]>[],
            waitlist: <HTMLElement[]>[],
            gifts: <HTMLElement[]>[],
            passes: <HTMLElement[]>[],
            coupons: <HTMLElement[]>[],
        };

        for (const [storeId, nodes] of storeIdsMap) {
            if (settings.owned        && dsStatus.owned.has(storeId))        { actions.owned.push(...nodes); }
            if (settings.wishlisted   && dsStatus.wishlisted.has(storeId))   { actions.wishlist.push(...nodes); }
            if (settings.ignored      && dsStatus.ignored.has(storeId))      { actions.ignored.push(...nodes); }
            if (settings.ignoredOwned && dsStatus.ignoredOwned.has(storeId)) { actions.ignoredOwned.push(...nodes); }
            if (inCollection.has(storeId))    { actions.collection.push(...nodes); }
            if (inWaitlist.has(storeId))      { actions.waitlist.push(...nodes); }
            if (invGiftAppids.has(storeId))   { actions.gifts.push(...nodes); }
            if (invPassAppids.has(storeId))   { actions.passes.push(...nodes); }
            if (invCouponAppids.has(storeId)) { actions.coupons.push(...nodes); }
        }

        this.highlightOwned(actions.owned);
        this.highlightWishlist(actions.wishlist);
        this.highlightIgnored(actions.ignored);
        this.highlightIgnoredOwnedElsewhere(actions.ignoredOwned);
        this.highlightCollection(actions.collection);
        this.highlightWaitlist(actions.waitlist);
        this.highlightInvGift(actions.gifts);
        this.highlightInvGuestpass(actions.passes);
        this.highlightInvCoupon(actions.coupons);
    }

    static _addTag(node: HTMLElement, tag: string): void {

        const locale = {
            owned:         __tag_owned,
            wishlist:      __tag_wishlist,
            coupon:        __tag_coupon,
            inv_gift:      __tag_invGift,
            inv_guestpass: __tag_invGuestpass,
            notinterested: __tag_notinterested,
            ignored_owned: __tag_ignoredOwned,
            waitlist:      __tag_waitlist,
            collection:    __tag_collection,
        }[tag] ?? __thewordunknown;

        if (!this._tagCssLoaded) {
            this._tagCssLoaded = true;

            const tagCss = [];
            const colors = {
                owned:         Settings.tag_owned_color,
                wishlist:      Settings.tag_wishlist_color,
                coupon:        Settings.tag_coupon_color,
                inv_gift:      Settings.tag_inv_gift_color,
                inv_guestpass: Settings.tag_inv_guestpass_color,
                notinterested: Settings.tag_notinterested_color,
                ignored_owned: Settings.tag_ignored_owned_color,
                waitlist:      Settings.tag_waitlist_color,
                collection:    Settings.tag_collection_color,
            };

            for (const [name, color] of Object.entries(colors)) {
                tagCss.push(`.es_tag_${name} { background-color: ${color}; }`);
            }

            DOMHelper.insertCSS(tagCss.join("\n"));
        }

        // Add the tags container if needed
        let container = node.querySelector(".es_tags");
        if (!container) {
            container = document.createElement("div");
            container.classList.add("es_tags");
            if (Settings.tag_short) {
                container.classList.add("es_tags_short");
            }

            if (node.classList.contains("tab_item")) {
                node.querySelector(".tab_item_details")!.prepend(container);
            } else if (node.classList.contains("store_main_capsule")) {
                node.querySelector(".platforms")!.prepend(container);
            } else if (node.classList.contains("newonsteam_headercap") || node.classList.contains("comingsoon_headercap")) {
                node.querySelector(".discount_block")!.before(container);
            } else if (node.classList.contains("search_result_row")) {
                node.querySelector(".search_name > div")!.prepend(container);
            } else if (node.classList.contains("browse_tag_game")) {
                node.querySelector(".browse_tag_game_price")!.after(container);
            } else if (node.classList.contains("game_area_dlc_row")) {
                // Must check discount block first
                const priceNode = node.querySelector(".discount_block") || node.querySelector(".game_area_dlc_price");
                priceNode!.prepend(container);
            } else if (node.classList.contains("wishlist_row")) {
                node.querySelector(".addedon")!.prepend(container);
            } else if (node.classList.contains("match_app")) {
                node.querySelector(".match_subtitle")!.prepend(container);
            } else if (node.classList.contains("header_image")) {
                node.parentNode!.querySelector(".highlight_description")!.prepend(container);
            } else if (node.classList.contains("similar_grid_item")) {
                node.querySelector(".regular_price, .discount_block")!.append(container);
            } else if (node.classList.contains("recommendation_carousel_item")) {
                node.querySelector(".buttons")!.before(container);
            } else if (node.classList.contains("friendplaytime_game")) {
                node.querySelector(".friendplaytime_buttons")!.before(container);
            }
        }

        HTML.beforeEnd(container, `<span class="es_tag_${tag}">${L(locale)}</span>`);
    }

    static _highlightNode(node: HTMLElement, type: string): void {

        if (Settings.highlight_excludef2p) {
            let _node = node.querySelector<HTMLElement>("[data-ds-tagids]") ?? node.closest<HTMLElement>("[data-ds-tagids]");
            // Check for the "Free to Play" tag
            if (_node && JSON.parse(_node.dataset.dsTagids!).includes(113)) { return; }
            // Check if the price is "Free", only works for English users
            _node = node.querySelector(".discount_final_price, .regular_price, .search_price, .game_area_dlc_price, .browse_tag_game_price");
            if (_node && /\bFree\b/.test(_node.textContent ?? "")) { return; }
        }

        if (!this._highlightCssLoaded) {
            this._highlightCssLoaded = true;

            const hlCss = [];

            /*
             * NOTE: the sequence of these entries determines the precendence of the highlights!
             * The later it appears in the array, the higher its precedence
             */
            const colors = {
                ignored_owned: Settings.highlight_ignored_owned_color,
                notinterested: Settings.highlight_notinterested_color,
                waitlist:      Settings.highlight_waitlist_color,
                wishlist:      Settings.highlight_wishlist_color,
                collection:    Settings.highlight_collection_color,
                owned:         Settings.highlight_owned_color,
                coupon:        Settings.highlight_coupon_color,
                inv_guestpass: Settings.highlight_inv_guestpass_color,
                inv_gift:      Settings.highlight_inv_gift_color,
            };

            for (const [name, color] of Object.entries(colors)) {
                hlCss.push(
                    `.es_highlighted_${name} {
                        background: ${color} linear-gradient(135deg, rgba(0, 0, 0, 0.70) 10%, rgba(0, 0, 0, 0) 100%) !important;
                    }
                    .curator_giant_capsule.es_highlighted_${name},
                    .blotter_userstatus_game.es_highlighted_${name},
                    #curator_avatar_image.es_highlighted_${name} .curator_avatar,
                    .app_header.es_highlighted_${name} {
                        outline: solid ${color};
                    }
                    .apphub_AppName.es_highlighted_${name} {
                        background: none !important; color: ${color};
                    }`
                );
            }

            DOMHelper.insertCSS(hlCss.join("\n"));
        }

        // Find the node to highlight if needed
        let nodeToHighlight: HTMLElement|null = node;

        if (node.classList.contains("item")) {
            nodeToHighlight = node.querySelector<HTMLElement>(".info");
        } else if (node.classList.contains("home_area_spotlight")) {
            nodeToHighlight = node.querySelector(".spotlight_content");
        } else if (node.classList.contains("special_img_ctn") && node.parentElement?.classList.contains("special")) {
            nodeToHighlight = node.parentElement;
        } else if (node.classList.contains("store_capsule")) {
            if (node.parentElement?.classList.contains("steam_curator_recommendation")
                && node.parentElement?.classList.contains("big")) {
                // curators/ (larger store capsule)
                nodeToHighlight = node.nextElementSibling as HTMLElement;
            } else if (node.parentNode?.parentElement?.classList.contains("curations")) {
                nodeToHighlight = node.parentElement;
            }
        } else if (
            // Small game capsules on activity page (e.g. when posting a status about a game)
            node.classList.contains("blotter_userstats_game")
            || node.classList.contains("gamelink")
            || node.classList.contains("recommendation_app")
            || node.classList.contains("header_image")
            || node.classList.contains("game_capsule")
            || node.classList.contains("highlighted_app_header")
            || node.classList.contains("friendplaytime_appheader")
        ) {
            nodeToHighlight = node.parentNode as HTMLElement;
        }

        nodeToHighlight?.classList.add("es_highlighted", `es_highlighted_${type}`);

        // Remove DS flags
        node.querySelectorAll<HTMLElement>(".ds_flag").forEach((node: HTMLElement) => node.remove());
        node.querySelectorAll<HTMLElement>(".ds_flagged").forEach((node: HTMLElement) => node.classList.remove("ds_flagged"));
        node.classList.remove("ds_flagged");
    }

    private static _highlightItems(nodes: Iterable<HTMLElement>, name: string, tag: boolean, highlight: boolean): void {
        for (const node of nodes) {
            if (highlight) {
                try {
                    this._highlightNode(node, name);
                } catch (err) {
                    console.error("Failed to highlight node", err);
                }
            }

            if (tag) {
                try {
                    this._addTag(node, name);
                } catch (err) {
                    console.error("Failed to tag node", err);
                }
            }
        }
    }

    static highlightOwned(nodes: Iterable<HTMLElement>): void {
        this._highlightItems(nodes, "owned",
            Settings.tag_owned,
            Settings.highlight_owned
        );
    }

    private static highlightWishlist(nodes: Iterable<HTMLElement>): void {
        this._highlightItems(nodes, "wishlist",
            Settings.tag_wishlist,
            Settings.highlight_wishlist
        );
    }

    private static highlightInvCoupon(nodes: Iterable<HTMLElement>): void {
        this._highlightItems(nodes, "coupon",
            Settings.tag_coupon,
            Settings.highlight_coupon
        );
    }

    private static highlightInvGift(nodes: Iterable<HTMLElement>): void {
        this._highlightItems(nodes, "inv_gift",
            Settings.tag_inv_gift,
            Settings.highlight_inv_gift
        );
    }

    private static highlightInvGuestpass(nodes: Iterable<HTMLElement>): void {
        this._highlightItems(nodes, "inv_guestpass",
            Settings.tag_inv_guestpass,
            Settings.highlight_inv_guestpass
        );
    }

    private static highlightIgnored(nodes: Iterable<HTMLElement>): void {
        this._highlightItems(nodes, "notinterested",
            Settings.tag_notinterested,
            Settings.highlight_notinterested
        );
    }

    private static highlightIgnoredOwnedElsewhere(nodes: Iterable<HTMLElement>): void {
        this._highlightItems(nodes, "ignored_owned",
            Settings.tag_ignored_owned,
            Settings.highlight_ignored_owned
        );
    }

    private static highlightCollection(nodes: Iterable<HTMLElement>): void {
        this._highlightItems(nodes, "collection",
            Settings.tag_collection,
            Settings.highlight_collection
        );
    }

    private static highlightWaitlist(nodes: Iterable<HTMLElement>): void {
        this._highlightItems(nodes, "waitlist",
            Settings.tag_waitlist,
            Settings.highlight_waitlist
        );
    }
}
