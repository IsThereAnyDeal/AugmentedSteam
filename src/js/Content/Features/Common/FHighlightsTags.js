import {GameId, HTML, Localization, SyncedStorage} from "../../../modulesCore";
import {DOMHelper, DynamicStore, Feature, ITAD, Inventory} from "../../modulesContent";

export default class FHighlightsTags extends Feature {

    async apply() {

        await DynamicStore.onReady();

        return Promise.all([
            FHighlightsTags.highlightTitle(this.context.appid),
            FHighlightsTags.highlightAndTag(),
        ]);
    }

    static highlightTitle(appid) {

        const title = document.querySelector(".apphub_AppName");
        if (!title) { return null; }

        title.dataset.dsAppid = appid;

        return FHighlightsTags.highlightAndTag([title], false);
    }

    /**
     * Highlights and tags DOM nodes that are owned, wishlisted, ignored, collected, waitlisted
     * or that the user has a gift, a guest pass or coupon for.
     *
     * @param {NodeList|Array} nodes - The nodes that should get highlighted
     * (defaults to all known nodes that are highlightable and taggable)
     * @param {boolean} hasDsInfo - Whether or not the supplied nodes contain dynamic store info (defaults to true)
     * @param {Object} options - Option overrides that should be applied
     * @returns {Promise} - Resolved once the highlighting and tagging completed for the nodes
     */
    static async highlightAndTag(nodes, hasDsInfo = true, options = {}) {

        if (typeof FHighlightsTags._options === "undefined") {
            FHighlightsTags._options = {
                "owned": SyncedStorage.get("highlight_owned") || SyncedStorage.get("tag_owned"),
                "wishlisted": SyncedStorage.get("highlight_wishlist") || SyncedStorage.get("tag_wishlist"),
                "ignored": SyncedStorage.get("highlight_notinterested") || SyncedStorage.get("tag_notinterested"),
                "collected": SyncedStorage.get("highlight_collection") || SyncedStorage.get("tag_collection"),
                "waitlisted": SyncedStorage.get("highlight_waitlist") || SyncedStorage.get("tag_waitlist"),
                "gift": SyncedStorage.get("highlight_inv_gift") || SyncedStorage.get("tag_inv_gift"),
                "guestPass": SyncedStorage.get("highlight_inv_guestpass") || SyncedStorage.get("tag_inv_guestpass"),
                "coupon": SyncedStorage.get("highlight_coupon") || SyncedStorage.get("tag_coupon"),
            };
        }

        const opts = {...this._options, ...options};
        if (!Object.values(opts).some(x => x)) { return; }

        const _nodes = nodes || document.querySelectorAll(this._selector);
        if (_nodes.length === 0) { return; }

        const storeIdsMap = new Map();

        for (const node of _nodes) {

            if (node.classList.contains("es_highlight_checked")) { continue; }
            node.classList.add("es_highlight_checked");

            const aNode = node.querySelector("a");

            const appid = GameId.getAppid(node) || GameId.getAppid(aNode);
            const subid = GameId.getSubid(node) || GameId.getSubid(aNode);
            const bundleid = GameId.getBundleid(node) || GameId.getBundleid(aNode);

            let storeId;
            if (appid) {
                storeId = `app/${appid}`;
            } else if (bundleid) {
                storeId = `bundle/${bundleid}`;
            } else if (subid) {
                storeId = `sub/${subid}`;
            }

            if (storeId) {
                if (storeIdsMap.has(storeId)) {
                    storeIdsMap.get(storeId).push(node);
                } else {
                    storeIdsMap.set(storeId, [node]);
                }
            } else {
                console.warn("FHighlightsTags: Couldn't find storeId for node %o", node);
            }

            if (hasDsInfo) {
                try {
                    if (opts.owned && node.querySelector(".ds_owned_flag") !== null) {
                        this.highlightOwned(node);
                    }
                    if (opts.wishlisted && node.querySelector(".ds_wishlist_flag") !== null) {
                        this.highlightWishlist(node);
                    }
                    if (opts.ignored && node.querySelector(".ds_ignored_flag") !== null) {
                        this.highlightIgnored(node);
                    }
                } catch (err) {
                    console.error("Failed to highlight / tag node", err);
                }
            }
        }

        const storeIds = Array.from(storeIdsMap.keys());
        if (storeIds.length === 0) { return; }

        const trimmedStoreIds = storeIds.map(id => GameId.trimStoreId(id));

        const includeDsInfo = !hasDsInfo && (opts.owned || opts.wishlisted || opts.ignored);

        const [dsStatus, itadStatus, invStatus] = await Promise.all([
            includeDsInfo ? DynamicStore.getAppStatus(storeIds) : Promise.resolve(),
            ITAD.getAppStatus(storeIds, {
                "waitlist": opts.waitlisted,
                "collection": opts.collected,
            }),
            Inventory.getAppStatus(trimmedStoreIds, {
                "giftsAndPasses": opts.gift || opts.guestPass,
                "coupons": opts.coupon,
            }),
        ]);

        const it = trimmedStoreIds.values();
        for (const [storeId, nodes] of storeIdsMap) {

            const operations = [];

            if (dsStatus) {
                if (opts.owned && dsStatus[storeId].owned) {
                    operations.push(this.highlightOwned);
                }
                if (opts.wishlisted && dsStatus[storeId].wishlisted) {
                    operations.push(this.highlightWishlist);
                }
                if (opts.ignored && dsStatus[storeId].ignored) {
                    operations.push(this.highlightIgnored);
                }
            }

            /*
             * Don't need to check for the opts object for itad and inv, since the result
             * contains `false` for every property if the highlight has been disabled
             */
            if (itadStatus) {
                if (itadStatus[storeId].collected) {
                    operations.push(this.highlightCollection);
                }
                if (itadStatus[storeId].waitlisted) {
                    operations.push(this.highlightWaitlist);
                }
            }

            if (invStatus) {
                const trimmedId = it.next().value;
                if (invStatus[trimmedId].gift) {
                    operations.push(this.highlightInvGift);
                }
                if (invStatus[trimmedId].guestPass) {
                    operations.push(this.highlightInvGuestpass);
                }
                if (invStatus[trimmedId].coupon) {
                    operations.push(this.highlightInvCoupon);
                }
            }

            for (let operation of operations) {
                operation = operation.bind(this);

                for (const node of nodes) {
                    try {
                        operation(node);
                    } catch (err) {
                        console.error("Failed to highlight / tag node", err);
                    }
                }
            }
        }
    }

    static _addTag(node, tag) {

        if (!this._tagCssLoaded) {
            this._tagCssLoaded = true;

            const tagCss = [];

            for (const name of this._types) {
                const color = SyncedStorage.get(`tag_${name}_color`);
                tagCss.push(`.es_tag_${name} { background-color: ${color}; }`);
            }

            DOMHelper.insertCSS(tagCss.join("\n"));
        }

        // Add the tags container if needed
        let container = node.querySelector(".es_tags");
        if (!container) {
            container = document.createElement("div");
            container.classList.add("es_tags");
            if (SyncedStorage.get("tag_short")) {
                container.classList.add("es_tags_short");
            }

            if (node.classList.contains("tab_item")) {
                node.querySelector(".tab_item_details").prepend(container);
            } else if (node.classList.contains("store_main_capsule")) {
                node.querySelector(".platforms").prepend(container);
            } else if (node.classList.contains("newonsteam_headercap") || node.classList.contains("comingsoon_headercap")) {
                node.querySelector(".discount_block").before(container);
            } else if (node.classList.contains("search_result_row")) {
                node.querySelector(".search_name > div").prepend(container);
            } else if (node.classList.contains("browse_tag_game")) {
                node.querySelector(".browse_tag_game_price").after(container);
            } else if (node.classList.contains("game_area_dlc_row")) {
                // Must check discount block first
                const priceNode = node.querySelector(".discount_block") || node.querySelector(".game_area_dlc_price");
                priceNode.prepend(container);
            } else if (node.classList.contains("wishlist_row")) {
                node.querySelector(".addedon").prepend(container);
            } else if (node.classList.contains("match_app")) {
                node.querySelector(".match_subtitle").prepend(container);
            } else if (node.classList.contains("header_image")) {
                node.parentNode.querySelector(".highlight_description").prepend(container);
            } else if (node.classList.contains("similar_grid_item")) {
                node.querySelector(".regular_price, .discount_block").append(container);
            } else if (node.classList.contains("recommendation_carousel_item")) {
                node.querySelector(".buttons").before(container);
            } else if (node.classList.contains("friendplaytime_game")) {
                node.querySelector(".friendplaytime_buttons").before(container);
            }
        }

        HTML.beforeEnd(container, `<span class="es_tag_${tag}">${Localization.str.tag[tag]}</span>`);
    }

    static _highlightNode(node, type) {

        if (SyncedStorage.get("highlight_excludef2p")) {

            let _node = node.querySelector("[data-ds-tagids]") || node.closest("[data-ds-tagids]");
            // Check for the "Free to Play" tag
            if (_node && JSON.parse(_node.dataset.dsTagids).includes(113)) { return; }
            // Check if the price is "Free", only works for English users
            _node = node.querySelector(".discount_final_price, .regular_price, .search_price, .game_area_dlc_price, .browse_tag_game_price");
            if (_node && /\bFree\b/.test(_node.textContent)) { return; }
        }

        if (!this._highlightCssLoaded) {
            this._highlightCssLoaded = true;

            const hlCss = [];

            for (const name of this._types) {
                const color = SyncedStorage.get(`highlight_${name}_color`);
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
        let nodeToHighlight = node;

        if (node.classList.contains("item")) {
            nodeToHighlight = node.querySelector(".info");
        } else if (node.classList.contains("home_area_spotlight")) {
            nodeToHighlight = node.querySelector(".spotlight_content");
        } else if (node.classList.contains("special_img_ctn") && node.parentNode?.classList.contains("special")) {
            nodeToHighlight = node.parentNode;
        } else if (node.classList.contains("store_capsule")) {
            if (node.parentNode?.classList.contains("steam_curator_recommendation")
                && node.parentNode?.classList.contains("big")) {
                // curators/ (larger store capsule)
                nodeToHighlight = node.nextElementSibling;
            } else if (node.parentNode?.parentNode?.classList.contains("curations")) {
                nodeToHighlight = node.parentNode;
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
            nodeToHighlight = node.parentNode;
        }

        nodeToHighlight.classList.add("es_highlighted", `es_highlighted_${type}`);

        // Remove DS flags
        node.querySelectorAll(".ds_flag").forEach(node => node.remove());
        node.querySelectorAll(".ds_flagged").forEach(node => node.classList.remove("ds_flagged"));
        node.classList.remove("ds_flagged");
    }

    static _highlightItem(node, name) {
        if (SyncedStorage.get(`highlight_${name}`)) {
            this._highlightNode(node, name);
        }

        if (SyncedStorage.get(`tag_${name}`)) {
            this._addTag(node, name);
        }
    }

    static highlightOwned(node) {
        this._highlightItem(node, "owned");
    }

    static highlightWishlist(node) {
        this._highlightItem(node, "wishlist");
    }

    static highlightInvCoupon(node) {
        this._highlightItem(node, "coupon");
    }

    static highlightInvGift(node) {
        this._highlightItem(node, "inv_gift");
    }

    static highlightInvGuestpass(node) {
        this._highlightItem(node, "inv_guestpass");
    }

    static highlightIgnored(node) {
        this._highlightItem(node, "notinterested");
    }

    static highlightCollection(node) {
        this._highlightItem(node, "collection");
    }

    static highlightWaitlist(node) {
        this._highlightItem(node, "waitlist");
    }
}

FHighlightsTags._highlightCssLoaded = false;
FHighlightsTags._tagCssLoaded = false;

/*
 * Attention, the sequence of these entries determines the precendence of the highlights!
 * The later it appears in the array, the higher its precedence
 */
FHighlightsTags._types = [
    "notinterested",
    "waitlist",
    "wishlist",
    "collection",
    "owned",
    "coupon",
    "inv_guestpass",
    "inv_gift",
];

// Note: select the node which has DS info, and traverse later when highlighting if needed
FHighlightsTags._selector = [
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
