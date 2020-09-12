import {ASFeature} from "modules/ASFeature";
import {DynamicStore, ExtensionLayer, ITAD, Inventory} from "common";
import {GameId, HTML, HTMLParser, Localization, SyncedStorage} from "core";

export class FHighlightsTags extends ASFeature {

    async apply() {

        await ExtensionLayer.runInPageContext(() => new Promise(resolve => { GDynamicStore.OnReady(() => { resolve(); }); }), null, true);

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
        if (!title) { return; }

        title.dataset.dsAppid = appid;

        return FHighlightsTags.highlightAndTag([title], false);
    }

    /**
     * Highlights and tags DOM nodes that are owned, wishlisted, ignored, collected, waitlisted
     * or that the user has a gift, a guest pass or coupon for.
     *
     * Additionally hides non-discounted titles if wished by the user.
     * @param {NodeList|Array} nodes    The nodes that should get highlighted (defaults to all known nodes that are highlightable and taggable)
     * @param {boolean} hasDsInfo       Whether or not the supplied nodes contain dynamic store info (defaults to true)
     * @param {Object} options          The highlights/tags that should be applied (defaults to all enabled)
     * @returns {Promise}               Resolved once the highlighting and tagging completed for the nodes
     */
    static async highlightAndTag(nodes = document.querySelectorAll(this._selector), hasDsInfo = true, options) {

        const opts = {"owned": true,
            "wishlisted": true,
            "ignored": true,
            "collected": true,
            "waitlisted": true,
            "gift": true,
            "guestPass": true,
            "coupon": true,
            ...options};

        const storeIdsMap = new Map();

        for (const node of nodes) {
            let nodeToHighlight = node;

            if (node.classList.contains("item")) {
                nodeToHighlight = node.querySelector(".info");
            } else if (node.classList.contains("home_area_spotlight")) {
                nodeToHighlight = node.querySelector(".spotlight_content");
            } else if (node.parentNode.classList.contains("steam_curator_recommendation") && node.parentNode.classList.contains("big")) {
                nodeToHighlight = node.nextElementSibling;
            } else if (node.parentNode.parentNode.classList.contains("curations")) {
                nodeToHighlight = node.parentNode;
            } else if (node.classList.contains("special_img_ctn") && node.parentElement.classList.contains("special")) {
                nodeToHighlight = node.parentElement;
            } else if (node.classList.contains("blotter_userstats_game")) { // Small game capsules on activity page (e.g. when posting a status about a game)
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
                    const arr = storeIdsMap.get(storeId);
                    arr.push(nodeToHighlight);
                    storeIdsMap.set(storeId, arr);
                } else {
                    storeIdsMap.set(storeId, [nodeToHighlight]);
                }
            }

            if (hasDsInfo) {
                if (node.querySelector(".ds_owned_flag") && opts.owned) {
                    this.highlightOwned(nodeToHighlight);
                }

                if (node.querySelector(".ds_wishlist_flag") && opts.wishlisted) {
                    this.highlightWishlist(nodeToHighlight);
                }

                if (node.querySelector(".ds_ignored_flag") && opts.ignored) {
                    this.highlightNotInterested(nodeToHighlight);
                }
            }

            if (node.classList.contains("search_result_row") && !node.querySelector(".search_discount span")) {
                this.highlightNonDiscounts(nodeToHighlight);
            }
        }

        const storeIds = Array.from(storeIdsMap.keys());
        const trimmedStoreIds = storeIds.map(id => GameId.trimStoreId(id));

        const includeDsInfo
            = !hasDsInfo
            && ((opts.owned && (SyncedStorage.get("highlight_owned") || SyncedStorage.get("tag_owned") || SyncedStorage.get("hide_owned")))
                || (opts.wishlisted && (SyncedStorage.get("highlight_wishlist") || SyncedStorage.get("tag_wishlist")))
                || (opts.ignored && (SyncedStorage.get("highlight_notinterested") || SyncedStorage.get("tag_notinterested") || SyncedStorage.get("hide_ignored")))
            );

        const [dsStatus, itadStatus, invStatus] = await Promise.all([
            includeDsInfo ? DynamicStore.getAppStatus(storeIds) : Promise.resolve(),
            ITAD.getAppStatus(storeIds, {
                "waitlist": opts.waitlisted && (SyncedStorage.get("highlight_waitlist") || SyncedStorage.get("tag_waitlist")),
                "collection": opts.collected && (SyncedStorage.get("highlight_collection") || SyncedStorage.get("tag_collection")),
            }),
            Inventory.getAppStatus(trimmedStoreIds, {
                "giftsAndPasses": opts.gift && (SyncedStorage.get("highlight_inv_gift") || SyncedStorage.get("tag_inv_gift"))
                                || opts.guestPass && (SyncedStorage.get("highlight_inv_guestpass") || SyncedStorage.get("tag_inv_guestpass")),
                "coupons": opts.coupon && (SyncedStorage.get("highlight_coupon") || SyncedStorage.get("tag_coupon")),
            }),
        ]);

        const it = trimmedStoreIds.values();
        for (const [storeid, nodes] of storeIdsMap) {
            if (dsStatus) {
                if (opts.owned && dsStatus[storeid].owned) { nodes.forEach(node => { this.highlightOwned(node); }); }
                if (opts.wishlisted && dsStatus[storeid].wishlisted) { nodes.forEach(node => { this.highlightWishlist(node); }); }
                if (opts.ignored && dsStatus[storeid].ignored) { nodes.forEach(node => { this.highlightNotInterested(node); }); }
            }

            // Don't need to check for the opts object here, since the result contains false for every property if the highlight has been disabled
            if (itadStatus) {
                if (itadStatus[storeid].collected) { nodes.forEach(node => { this.highlightCollection(node); }); }
                if (itadStatus[storeid].waitlisted) { nodes.forEach(node => { this.highlightWaitlist(node); }); }
            }

            if (invStatus) {
                const trimmedId = it.next().value;
                if (opts.gift && invStatus[trimmedId].gift) { nodes.forEach(node => { this.highlightInvGift(node); }); }
                if (opts.guestPass && invStatus[trimmedId].guestPass) { nodes.forEach(node => { this.highlightInvGuestpass(node); }); }
                if (invStatus[trimmedId].coupon) { nodes.forEach(node => { this.highlightCoupon(node); }); } // Same as for the ITAD highlights (don't need to check)
            }
        }
    }

    static _addTag(node, tag) {

        const tagShort = SyncedStorage.get("tag_short");

        // Load the colors CSS for tags
        if (!this._tagCssLoaded) {
            this._tagCssLoaded = true;

            const tagCss = [];

            for (const name of this._types) {
                const color = SyncedStorage.get(`tag_${name}_color`);
                tagCss.push(`.es_tag_${name} { background-color: ${color}; }`);
            }

            let style = document.createElement("style");
            style.id = "es_tag_styles";
            style.textContent = tagCss.join("\n");
            document.head.appendChild(style);
            style = null;
        }

        // Add the tags container if needed
        let tags = node.querySelectorAll(".es_tags");
        if (tags.length === 0) {
            tags = HTMLParser.htmlToElement(`<div class="es_tags ${tagShort ? "es_tags_short" : ""}"></div>`);

            let root;
            if (node.classList.contains("tab_row")) { // fixme can't find it
                root = node.querySelector(".tab_desc").classList.remove("with_discount");

                node.querySelector(".tab_discount").style.top = "15px";
                root.querySelector("h4").insertAdjacentElement("afterend", tags);
            } else if (node.classList.contains("home_smallcap")) {
                node.querySelector(".home_smallcap_title").insertAdjacentElement("afterbegin", tags);
            } else if (node.classList.contains("curated_app_item")) {
                node.querySelector(".home_headerv5_title").insertAdjacentElement("afterbegin", tags);
            } else if (node.classList.contains("tab_item")) {
                node.querySelector(".tab_item_name").insertAdjacentElement("afterend", tags);
            } else if (node.classList.contains("newonsteam_headercap") || node.classList.contains("comingsoon_headercap")) {
                node.querySelector(".discount_block").insertAdjacentElement("beforebegin", tags);
            } else if (node.classList.contains("search_result_row")) {
                node.querySelector("p").insertAdjacentElement("afterbegin", tags);
            } else if (node.classList.contains("dailydeal")) { // can't find it
                root = node.parentNode;
                root.querySelector(".game_purchase_action").insertAdjacentElement("beforebegin", tags);
                HTML.beforeBegin(root.querySelector(".game_purchase_action"), '<div style="clear: right;"></div>');
            } else if (node.classList.contains("browse_tag_game")) {
                node.querySelector(".browse_tag_game_price").insertAdjacentElement("afterend", tags);
            } else if (node.classList.contains("game_area_dlc_row")) {
                node.querySelector(".game_area_dlc_price").insertAdjacentElement("afterbegin", tags);
            } else if (node.classList.contains("wishlist_row")) {
                node.querySelector(".addedon").insertAdjacentElement("afterbegin", tags);
            } else if (node.classList.contains("match")) {
                node.querySelector(".match_price").insertAdjacentElement("afterbegin", tags);
            } else if (node.classList.contains("cluster_capsule")) {
                node.querySelector(".main_cap_platform_area").append(tags);
            } else if (node.classList.contains("recommendation_highlight")) {
                node.querySelector(".highlight_description").insertAdjacentElement("afterbegin", tags);
            } else if (node.classList.contains("similar_grid_item")) {
                node.querySelector(".regular_price, .discount_block").append(tags);
            } else if (node.classList.contains("recommendation_carousel_item")) {
                node.querySelector(".buttons").insertAdjacentElement("beforebegin", tags);
            } else if (node.classList.contains("friendplaytime_game")) {
                node.querySelector(".friendplaytime_buttons").insertAdjacentElement("beforebegin", tags);
            }

            tags = [tags];
        }

        // Add the tag
        for (const n of tags) {
            if (!n.querySelector(`.es_tag_${tag}`)) {
                HTML.beforeEnd(n, `<span class="es_tag_${tag}">${Localization.str.tag[tag]}</span>`);
            }
        }
    }

    static _highlightNode(node) {
        if (SyncedStorage.get("highlight_excludef2p")) {

            if (node.innerHTML.match(/<div class="(tab_price|large_cap_price|col search_price|main_cap_price|price)">\n?(.+)?(Free to Play|Play for Free!)(.+)?<\/div>/i)) {
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
                hlCss.push(`
                    .es_highlighted_${name} { background: ${color} linear-gradient(135deg, rgba(0, 0, 0, 0.70) 10%, rgba(0, 0, 0, 0) 100%) !important; }
                    .carousel_items .es_highlighted_${name}.price_inline, .curator_giant_capsule.es_highlighted_${name}, .hero_capsule.es_highlighted_${name}, .blotter_userstatus_game.es_highlighted_${name} { outline: solid ${color}; }
                    #search_suggestion_contents .focus.es_highlighted_${name} { box-shadow: -5px 0 0 ${color}; }
                    .apphub_AppName.es_highlighted_${name} { background: none !important; color: ${color}; }
                `);
            }

            let style = document.createElement("style");
            style.id = "es_highlight_styles";
            style.textContent = hlCss.join("\n");
            document.head.appendChild(style);
            style = null;
        }

        // Carousel item
        if (node.classList.contains("cluster_capsule")) {
            node = node.querySelector(".main_cap_content").parentNode;
        } else if (node.classList.contains("large_cap")) {

            // Genre Carousel items
            node = node.querySelector(".large_cap_content");
        } else if (node.parentNode.classList.contains("steam_curator_recommendation") && node.parentNode.classList.contains("big")) {
            node = node.previousElementSibling;
        }

        switch (true) {

            // Recommendations on front page when scrolling down
        case node.classList.contains("single"):
            node = node.querySelector(".gamelink");

            // don't break

        case node.parentNode.parentNode.classList.contains("apps_recommended_by_curators_v2"): {
            let r = node.querySelectorAll(".ds_flag");
            r.forEach(node => node.remove());
            r = node.querySelectorAll(".ds_flagged");
            r.forEach(node => node.classList.remove("ds_flagged"));
            break;
        }

        case node.classList.contains("info"):
        case node.classList.contains("spotlight_content"):
            node = node.parentElement;

            // don't break

        default: {
            let r = node.querySelector(".ds_flag");
            if (r) { r.remove(); }
            r = node.querySelector(".ds_flagged");
            if (r) {
                r.classList.remove("ds_flagged");
            }
            break;
        }
        }

        node.classList.remove("ds_flagged");
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

    static highlightWishlist(node) {
        this._highlightItem(node, "wishlist");
    }

    static highlightCoupon(node) {
        this._highlightItem(node, "coupon");
    }

    // Color the tile for items in inventory
    static highlightInvGift(node) {
        this._highlightItem(node, "inv_gift");
    }

    // Color the tile for items in inventory
    static highlightInvGuestpass(node) {
        this._highlightItem(node, "inv_guestpass");
    }

    static highlightNonDiscounts(node) {
        if (!SyncedStorage.get("highlight_notdiscounted")) { return; }
        node.style.display = "none";
    }

    static highlightOwned(node) {
        if (SyncedStorage.get("hide_owned") && (node.closest(".search_result_row") || node.closest(".tab_item"))) {
            node.style.display = "none";
        }
        this._highlightItem(node, "owned");
    }

    static highlightNotInterested(node) {
        if (SyncedStorage.get("hide_ignored") && (node.closest(".search_result_row") || node.closest(".tab_item"))) {
            node.style.display = "none";
        }
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
    "div.tab_row", // Storefront rows
    "div.dailydeal_ctn",
    ".store_main_capsule", // "Featured & Recommended"
    "div.wishlistRow", // Wishlist rows
    "a.game_area_dlc_row", // DLC on app pages
    "a.small_cap", // Featured storefront items and "recommended" section on app pages
    "a.home_smallcap",
    ".home_content_item", // Small items under "Keep scrolling for more recommendations"
    ".home_content.single", // Big items under "Keep scrolling for more recommendations"
    ".home_area_spotlight", // "Special offers" big items
    "a.search_result_row", // Search result rows
    "a.match", // Search suggestions rows
    ".highlighted_app", // For example "Recently Recommended" on curators page
    "a.cluster_capsule", // Carousel items
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
    ".tab_item", // Items on new homepage
    ".special > .special_img_ctn", // new homepage specials
    ".special.special_img_ctn",
    "div.curated_app_item", // curated app items!
    ".hero_capsule", // Summer sale "Featured"
    ".sale_capsule" // Summer sale general capsules
].map(sel => `${sel}:not(.es_highlighted)`)
    .join(",");
