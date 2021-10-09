import {GameId, HTML, Localization, SyncedStorage} from "../../../modulesCore";
import {DOMHelper, DynamicStore, Feature, ITAD, Inventory} from "../../modulesContent";
import {Page} from "../Page";

export default class FHighlightsTags extends Feature {

    async apply() {

        await Page.runInPageContext(() => new Promise(resolve => {
            window.SteamFacade.onDynamicStoreReady(() => { resolve(); });
        }), null, true);

        const searchBoxContents = document.getElementById("search_suggestion_contents");
        if (searchBoxContents) {
            const observer = new MutationObserver(records => {
                FHighlightsTags.highlightAndTag(records[0].addedNodes);
            });
            observer.observe(searchBoxContents, {"childList": true});
        }

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
    /* eslint-disable complexity -- FIXME */
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
            let nodeToHighlight = node;

            if (node.classList.contains("item")) {
                nodeToHighlight = node.querySelector(".info");
            } else if (node.classList.contains("home_area_spotlight")) {
                nodeToHighlight = node.querySelector(".spotlight_content");
            } else if (node.parentNode.classList.contains("steam_curator_recommendation")
                && node.parentNode.classList.contains("big")) {
                nodeToHighlight = node.nextElementSibling;
            } else if (node.parentNode.parentNode.classList.contains("curations")) {
                nodeToHighlight = node.parentNode;
            } else if (node.classList.contains("special_img_ctn") && node.parentElement.classList.contains("special")) {
                nodeToHighlight = node.parentElement;
            } else if (node.classList.contains("blotter_userstats_game")) {

                // Small game capsules on activity page (e.g. when posting a status about a game)
                nodeToHighlight = node.parentElement;
            }

            const aNode = node.querySelector("a");

            const appid = GameId.getAppid(node) || GameId.getAppid(aNode) || GameId.getAppidFromId(node.id);
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
                    storeIdsMap.get(storeId).push(nodeToHighlight);
                } else {
                    storeIdsMap.set(storeId, [nodeToHighlight]);
                }
            }

            if (hasDsInfo) {
                if (opts.owned && node.querySelector(".ds_owned_flag") !== null) {
                    this.highlightOwned(nodeToHighlight);
                }
                if (opts.wishlisted && node.querySelector(".ds_wishlist_flag") !== null) {
                    this.highlightWishlist(nodeToHighlight);
                }
                if (opts.ignored && node.querySelector(".ds_ignored_flag") !== null) {
                    this.highlightIgnored(nodeToHighlight);
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
        for (const [storeid, nodes] of storeIdsMap) {
            if (dsStatus) {
                if (opts.owned && dsStatus[storeid].owned) {
                    nodes.forEach(node => { this.highlightOwned(node); });
                }
                if (opts.wishlisted && dsStatus[storeid].wishlisted) {
                    nodes.forEach(node => { this.highlightWishlist(node); });
                }
                if (opts.ignored && dsStatus[storeid].ignored) {
                    nodes.forEach(node => { this.highlightIgnored(node); });
                }
            }

            /*
             * Don't need to check for the opts object here, since the result contains
             * false for every property if the highlight has been disabled
             */
            if (itadStatus) {
                if (itadStatus[storeid].collected) {
                    nodes.forEach(node => { this.highlightCollection(node); });
                }
                if (itadStatus[storeid].waitlisted) {
                    nodes.forEach(node => { this.highlightWaitlist(node); });
                }
            }

            if (invStatus) {
                const trimmedId = it.next().value;
                if (opts.gift && invStatus[trimmedId].gift) {
                    nodes.forEach(node => { this.highlightInvGift(node); });
                }

                if (opts.guestPass && invStatus[trimmedId].guestPass) {
                    nodes.forEach(node => { this.highlightInvGuestpass(node); });
                }

                // Same as for the ITAD highlights (don't need to check)
                if (invStatus[trimmedId].coupon) {
                    nodes.forEach(node => { this.highlightInvCoupon(node); });
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
                node.querySelector(".tab_item_details").insertAdjacentElement("afterbegin", container);
            } else if (node.classList.contains("newonsteam_headercap") || node.classList.contains("comingsoon_headercap")) {
                node.querySelector(".discount_block").insertAdjacentElement("beforebegin", container);
            } else if (node.classList.contains("search_result_row")) {
                node.querySelector("p").insertAdjacentElement("afterbegin", container);
            } else if (node.classList.contains("browse_tag_game")) {
                node.querySelector(".browse_tag_game_price").insertAdjacentElement("afterend", container);
            } else if (node.classList.contains("game_area_dlc_row")) {
                node.querySelector(".game_area_dlc_price").insertAdjacentElement("afterbegin", container);
            } else if (node.classList.contains("wishlist_row")) {
                node.querySelector(".addedon").insertAdjacentElement("afterbegin", container);
            } else if (node.classList.contains("match")) {
                node.querySelector(".match_price").insertAdjacentElement("afterbegin", container);
            } else if (node.classList.contains("recommendation_highlight")) {
                node.querySelector(".highlight_description").insertAdjacentElement("afterbegin", container);
            } else if (node.classList.contains("similar_grid_item")) {
                node.querySelector(".regular_price, .discount_block").append(container);
            } else if (node.classList.contains("recommendation_carousel_item")) {
                node.querySelector(".buttons").insertAdjacentElement("beforebegin", container);
            } else if (node.classList.contains("friendplaytime_game")) {
                node.querySelector(".friendplaytime_buttons").insertAdjacentElement("beforebegin", container);
            }
        }

        if (!container.querySelector(`.es_tag_${tag}`)) {
            HTML.beforeEnd(container, `<span class="es_tag_${tag}">${Localization.str.tag[tag]}</span>`);
        }
    }
    /* eslint-enable complexity */

    static _highlightNode(node) {
        if (SyncedStorage.get("highlight_excludef2p")) {

            if (node.innerHTML.match(
                /<div class="(tab_price|large_cap_price|col search_price|main_cap_price|price)">\n?(.+)?(Free to Play|Play for Free!)(.+)?<\/div>/i
            )) {
                return;
            }
            if (node.innerHTML.match(/<h5>(Free to Play|Play for Free!)<\/h5>/i)) {
                return;
            }
            if (node.innerHTML.match(/genre_release/) && node.querySelector(".genre_release").innerHTML.match(/Free to Play/i)) {
                return;
            }
            if (node.classList.contains("search_result_row") && node.innerHTML.match(/Free to Play/i)) {
                return;
            }
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
                    .carousel_items .es_highlighted_${name}.price_inline, .curator_giant_capsule.es_highlighted_${name},
                    .hero_capsule.es_highlighted_${name}, .blotter_userstatus_game.es_highlighted_${name} {
                        outline: solid ${color};
                    }
                    #search_suggestion_contents .focus.es_highlighted_${name} {
                        box-shadow: -5px 0 0 ${color};
                    }
                    .apphub_AppName.es_highlighted_${name} {
                        background: none !important; color: ${color};
                    }`
                );
            }

            DOMHelper.insertCSS(hlCss.join("\n"));
        }

        let _node = node;

        // Carousel item
        if (_node.classList.contains("cluster_capsule")) {
            _node = _node.querySelector(".main_cap_content").parentNode;
        } else if (_node.classList.contains("large_cap")) {

            // Genre Carousel items
            _node = _node.querySelector(".large_cap_content");
        } else if (_node.parentNode.classList.contains("steam_curator_recommendation")
            && _node.parentNode.classList.contains("big")) {
            _node = _node.previousElementSibling;
        }

        // Recommendations on front page when scrolling down
        if (_node.classList.contains("single")) {
            _node = _node.querySelector(".gamelink");
        }

        if (_node.parentNode.parentNode.classList.contains("apps_recommended_by_curators_v2")) {
            let r = _node.querySelectorAll(".ds_flag");
            r.forEach(node => node.remove());
            r = _node.querySelectorAll(".ds_flagged");
            r.forEach(node => node.classList.remove("ds_flagged"));
        } else {

            if (_node.classList.contains("info") || _node.classList.contains("spotlight_content")) {
                _node = _node.parentElement;
            }

            let r = _node.querySelector(".ds_flag");
            if (r) { r.remove(); }
            r = _node.querySelector(".ds_flagged");
            if (r) {
                r.classList.remove("ds_flagged");
            }
        }

        _node.classList.remove("ds_flagged");
    }

    static _highlightItem(node, name) {
        node.classList.add("es_highlight_checked");

        if (SyncedStorage.get(`highlight_${name}`)) {
            node.classList.add("es_highlighted", `es_highlighted_${name}`);
            this._highlightNode(node);
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

FHighlightsTags._selector = [
    ".store_main_capsule", // "Featured & Recommended"
    "a.game_area_dlc_row", // DLC on app pages
    "a.small_cap", // Featured storefront items and "recommended" section on app pages
    ".home_content_item", // Small items under "Keep scrolling for more recommendations"
    ".home_content.single", // Big items under "Keep scrolling for more recommendations"
    ".home_area_spotlight", // "Special offers" big items
    "a.search_result_row", // Search result rows
    "a.match", // Search suggestions rows
    ".highlighted_app", // For example "Recently Recommended" on curators page
    "div.recommendation_highlight", // Recommendation pages
    "div.recommendation_carousel_item", // Recommendation pages
    "div.friendplaytime_game", // Recommendation pages
    ".recommendation_row", // "Recent recommendations by friends"
    ".friendactivity_tab_row", // "Most played" and "Most wanted" tabs on recommendation pages
    ".friend_game_block", // "Friends recently bought"
    ".recommendation", // Curator pages and the new DLC pages
    ".curator_giant_capsule",
    "div.carousel_items.curator_featured > div", // Carousel items on Curator pages
    "div.item_ctn", // Curator list item
    ".store_capsule", // All sorts of items on almost every page
    ".newonsteam_headercap", // explore/new/
    ".comingsoon_headercap", // explore/upcoming/
    ".home_marketing_message", // "Updates and offers"
    "div.dlc_page_purchase_dlc", // DLC page rows
    "div.sale_page_purchase_item", // Sale pages
    "div.item", // Sale pages / featured pages
    "div.home_area_spotlight", // Midweek and weekend deals
    "div.browse_tag_game", // Tagged games
    "div.similar_grid_item", // Items on the "Similarly tagged" pages
    ".tab_item", // Item rows on storefront/tag/genre pages
    ".special > .special_img_ctn", // new homepage specials
    ".special.special_img_ctn",
    ".hero_capsule", // Summer sale "Featured"
    ".sale_capsule" // Summer sale general capsules
].map(sel => `${sel}:not(.es_highlighted)`)
    .join(",");
