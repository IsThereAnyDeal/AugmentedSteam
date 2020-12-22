import {HTML, Localization} from "../../../../modulesCore";
import {CommunityUtils, DOMHelper, Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FBadgeSortAndFilter extends Feature {

    apply() {
        this._addSort();
        this._addFilter();
        this._addViewOptions();
    }

    _addSort() {

        const isOwnProfile = CommunityUtils.currentUserIsOwner();
        const sorts = ["c", "a", "r"];

        const sorted = document.querySelector("a.badge_sort_option.active").search.replace("?sort=", "")
            || (isOwnProfile ? "p" : "c");

        let linksHtml = "";

        if (isOwnProfile) {
            sorts.unshift("p");
        }

        // Build dropdown links HTML
        const nodes = document.querySelectorAll(".profile_badges_sortoptions a");
        let i = 0;
        for (const node of nodes) {
            linksHtml += `<a class="popup_menu_item by_${sorts[i]}" data-sort-by="${sorts[i]}" href="?sort=${sorts[i]}">${node.textContent.trim()}</a>`;
            i++;
        }
        if (isOwnProfile) {
            linksHtml += `<a class="popup_menu_item by_d" data-sort-by="d" id="es_badge_sort_drops">${Localization.str.most_drops}</a>`;
            linksHtml += `<a class="popup_menu_item by_v" data-sort-by="v" id="es_badge_sort_value">${Localization.str.drops_value}</a>`;
        }

        const container = document.createElement("span");
        container.id = "wishlist_sort_options";
        DOMHelper.wrap(container, document.querySelector(".profile_badges_sortoptions"));

        // Insert dropdown options links
        HTML.beforeEnd(".profile_badges_sortoptions",
            `<div id="es_sort_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown">
                <div class="popup_body popup_menu">${linksHtml}</div>
            </div>`);

        // Insert dropdown button
        HTML.afterEnd(".profile_badges_sortoptions span",
            `<span id="wishlist_sort_options">
                <div class="store_nav">
                    <div class="tab flyout_tab" id="es_sort_tab" data-flyout="es_sort_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_sort_active">${document.querySelector(`#es_sort_flyout a.by_${sorted}`).textContent}</div>
                            <span></span>
                        </span>
                    </div>
                </div>
            </span>`);

        Page.runInPageContext(() => { window.SteamFacade.bindAutoFlyoutEvents(); });

        if (isOwnProfile) {
            document.querySelector("#es_badge_sort_drops").addEventListener("click", async e => {

                if (this.context.hasMultiplePages) {
                    await this._loadAllPages();
                }

                this._sortBadgeRows(e.target.textContent, (node) => {
                    let content = 0;
                    const progressInfo = node.innerHTML.match(/progress_info_bold".+(\d+)/);
                    if (progressInfo) {
                        content = parseInt(progressInfo[1]);
                    }
                    return content;
                });
            });

            document.querySelector("#es_badge_sort_value").addEventListener("click", async e => {

                if (this.context.hasMultiplePages) {
                    await this._loadAllPages();
                }

                this._sortBadgeRows(e.target.textContent, (node) => {
                    let content = 0;
                    const dropWorth = node.querySelector(".es_card_drop_worth");
                    if (dropWorth) {
                        content = parseFloat(dropWorth.dataset.esCardWorth);
                    }
                    return content;
                });
            });
        }
    }

    _addFilter() {

        const html
            = ` <span>${Localization.str.show}</span>
                <div class="store_nav">
                    <div class="tab flyout_tab" id="es_filter_tab" data-flyout="es_filter_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_filter_active">${Localization.str.badges_all}</div>
                            <span></span>
                        </span>
                    </div>
                </div>
                <div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_filter_flyout">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item es_bg_filter" id="es_badge_all">${Localization.str.badges_all}</a>
                        <a class="popup_menu_item es_bg_filter" id="es_badge_drops">${Localization.str.badges_drops}</a>
                    </div>
                </div>`;

        HTML.afterBegin("#wishlist_sort_options",
            `<div class='es_badge_filter'>${html}</div>`);

        document.querySelector("#es_badge_all").addEventListener("click", () => {
            for (const badge of document.querySelectorAll(".is_link")) {
                badge.style.display = "block";
            }
            document.querySelector("#es_filter_active").textContent = Localization.str.badges_all;
            document.querySelector("#es_filter_flyout").style.display = "none"; // TODO fadeout
            this._resetLazyLoader();
        });

        document.querySelector("#es_badge_drops").addEventListener("click", async e => {
            e.preventDefault();

            // Load additinal badge sections if multiple pages are present
            if (this.context.hasMultiplePages) {
                await this._loadAllPages();
            }

            for (const node of document.querySelectorAll(".is_link")) {
                const progress = node.innerHTML.match(/progress_info_bold".+(\d+)/);
                if (!progress || parseInt(progress[1]) === 0) {
                    node.style.display = "none";
                } else if (node.innerHTML.match(/badge_info_unlocked/) && !node.innerHTML.match(/badge_current/)) {
                    node.style.display = "none";

                // Hide foil badges too
                } else if (!node.innerHTML.match(/progress_info_bold/)) {
                    node.style.display = "none";
                }
            }

            document.querySelector("#es_filter_active").textContent = Localization.str.badges_drops;
            document.querySelector("#es_filter_flyout").style.display = "none"; // TODO fadeOut();
            this._resetLazyLoader();
        });
    }

    _addViewOptions() {

        const html
            = ` <span>${Localization.str.view}</span>
                <div class="store_nav">
                    <div class="tab flyout_tab" id="es_badgeview_tab" data-flyout="es_badgeview_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_badgeview_active">${Localization.str.theworddefault}</div>
                            <span></span>
                        </span>
                    </div>
                </div>
                <div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_badgeview_flyout">
                    <div class="popup_body popup_menu">
                        <a class="popup_menu_item es_bg_view" data-view="defaultview">${Localization.str.theworddefault}</a>
                        <a class="popup_menu_item es_bg_view" data-view="binderview">${Localization.str.binder_view}</a>
                    </div>
                </div>`;

        HTML.afterBegin("#wishlist_sort_options", `<div class='es_badge_view'>${html}</div>`);

        // Change hash when selecting view
        document.querySelector("#es_badgeview_flyout").addEventListener("click", ({target}) => {
            const node = target.closest(".es_bg_view");
            if (!node) { return; }
            window.location.hash = node.dataset.view;
        });

        // Monitor for hash changes
        window.addEventListener("hashchange", () => { this._toggleBinderView(); });

        this._toggleBinderView();
    }

    async _loadAllPages() {

        if (this._hasAllPagesLoaded) { return; }
        this._hasAllPagesLoaded = true;

        const sheetNode = document.querySelector(".badges_sheet");

        // let images = Viewport.getVariableFromDom("g_rgDelayedLoadImages", "object");

        await this.context.eachBadgePage(dom => {
            const nodes = dom.querySelectorAll(".badge_row");
            for (const node of nodes) {
                sheetNode.append(node);
            }

            this.context.triggerCallbacks();

            // images = Object.assign(images, Viewport.getVariableFromDom("g_rgDelayedLoadImages", "object", dom));
        });

        const nodes = document.querySelectorAll(".profile_paging");
        for (const node of nodes) {
            node.style.display = "none";
        }

        /*
         * TODO this doesn't seem to work, can't figure out why right now. Lazy loader doesn't see updated object?
         * ExtensionLayer.runInPageContext("function(){g_rgDelayedLoadImages = " + JSON.stringify(images) + ";}");
         * resetLazyLoader();
         */
    }

    _sortBadgeRows(activeText, nodeValueCallback) {
        const badgeRows = [];
        const nodes = document.querySelectorAll(".badge_row");
        for (const node of nodes) {
            badgeRows.push([node.outerHTML, nodeValueCallback(node)]);
            node.remove();
        }

        badgeRows.sort((a, b) => b[1] - a[1]);

        const sheetNode = document.querySelector(".badges_sheet");
        for (const row of badgeRows) {
            HTML.beforeEnd(sheetNode, row[0]);
        }

        this._resetLazyLoader();
        document.querySelector("#es_sort_active").textContent = activeText;
        document.querySelector("#es_sort_flyout").style.display = "none"; // TODO fadeout
    }

    _resetLazyLoader() {

        // FIXME this doesn't seem to work

        /*
         * ExtensionLayer.runInPageContext(() => {
         *
         *  // Clear registered image lazy loader watchers (CScrollOffsetWatcher is found in shared_global.js)
         *  CScrollOffsetWatcher.sm_rgWatchers = [];
         *
         *  // Recreate registered image lazy loader watchers
         *  $J("div[id^=image_group_scroll_badge_images_gamebadge_]").each((i, e) => {
         *
         *      // LoadImageGroupOnScroll is found in shared_global.js
         *      LoadImageGroupOnScroll(e.id, e.id.substr(19));
         *  });
         * });
         */
    }

    _toggleBinderView() {

        if (window.location.hash === "#binderview") {
            document.querySelector("div.maincontent").classList.add("es_binder_view");

            const mainNode = document.querySelector("div.maincontent");

            // Don't attempt changes again if already loaded
            if (!mainNode.classList.contains("es_binder_loaded")) {
                mainNode.classList.add("es_binder_loaded");

                for (const node of document.querySelectorAll("div.badge_row.is_link")) {
                    const stats = node.querySelector("span.progress_info_bold");
                    if (stats && stats.innerHTML.match(/\d+/)) {
                        HTML.beforeEnd(node.querySelector("div.badge_content"),
                            `<span class='es_game_stats'>${stats.outerHTML}</span>`);
                    }

                    const infoNode = node.querySelector("div.badge_progress_info");
                    if (infoNode) {
                        const card = infoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                        const text = (card) ? `${card[1]} / ${card[2]}` : "";
                        HTML.beforeBegin(infoNode, `<div class="es_badge_progress_info">${text}</div>`);
                    }
                }
            }

            // Add hash to pagination links
            for (const node of document.querySelectorAll("div.pageLinks a.pagelink, div.pageLinks a.pagebtn")) {
                node.href += "#binderview";
            }

            // Triggers the loading of out-of-view badge images
            window.dispatchEvent(new Event("resize"));
            document.querySelector("#es_badgeview_active").textContent = Localization.str.binder_view;
        } else {
            document.querySelector("div.maincontent").classList.remove("es_binder_view");

            for (const node of document.querySelectorAll("div.pageLinks a.pagelink, div.pageLinks a.pagebtn")) {
                node.href = node.href.replace("#binderview", "");
            }

            document.querySelector("#es_badgeview_active").textContent = Localization.str.theworddefault;
        }
    }
}
