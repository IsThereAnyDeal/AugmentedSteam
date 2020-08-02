import {ASFeature} from "modules/ASFeature";

import {HTML, Localization} from "core";
import {DOMHelper, ExtensionLayer} from "common";
import {CommunityCommon} from "community/common";

export class FBadgeSortAndFilter extends ASFeature {

    apply() {
        this._addSort();
        this._addFilter();
        this._addViewOptions();
    }

    _addSort() {

        let isOwnProfile = CommunityCommon.currentUserIsOwner();
        let sorts = ["c", "a", "r"];

        let sorted = document.querySelector("a.badge_sort_option.active").search.replace("?sort=", "")
            || (isOwnProfile ? "p": "c");

        let linksHtml = "";

        if (isOwnProfile) {
            sorts.unshift("p");
        }

        // Build dropdown links HTML
        let nodes = document.querySelectorAll(".profile_badges_sortoptions a");
        let i=0;
        for (let node of nodes) {
            node.style.display = "none";
            linksHtml += `<a class="badge_sort_option popup_menu_item by_${sorts[i]}" data-sort-by="${sorts[i]}" href="?sort=${sorts[i]}">${node.textContent.trim()}</a>`;
            i++;
        }
        if (isOwnProfile) {
            linksHtml += '<a class="badge_sort_option popup_menu_item by_d" data-sort-by="d" id="es_badge_sort_drops">' + Localization.str.most_drops + '</a>';
            linksHtml += '<a class="badge_sort_option popup_menu_item by_v" data-sort-by="v" id="es_badge_sort_value">' + Localization.str.drops_value + '</a>';
        }

        let container = document.createElement("span");
        container.id = "wishlist_sort_options";
        DOMHelper.wrap(container, document.querySelector(".profile_badges_sortoptions"));

        // Insert dropdown options links
        HTML.beforeEnd(".profile_badges_sortoptions",
            `<div id="es_sort_flyout" class="popup_block_new flyout_tab_flyout responsive_slidedown" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;">
			    <div class="popup_body popup_menu">${linksHtml}</div>
		    </div>`);

        // Insert dropdown button
        HTML.afterEnd(".profile_badges_sortoptions span",
            `<span id="wishlist_sort_options">
                <div class="store_nav">
                    <div class="tab flyout_tab" id="es_sort_tab" data-flyout="es_sort_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                        <span class="pulldown">
                            <div id="es_sort_active" style="display: inline;">` + document.querySelector("#es_sort_flyout a.by_" + sorted).textContent + `</div>
                            <span></span>
                        </span>
                    </div>
                </div>
            </span>`);

        ExtensionLayer.runInPageContext(() => { BindAutoFlyoutEvents(); });

        if (isOwnProfile) {
            document.querySelector("#es_badge_sort_drops").addEventListener("click", async e => {

                if (this.context.hasMultiplePages) {
                    await this._loadAllPages();
                }

                this._sortBadgeRows(e.target.textContent, (node) => {
                    let content = 0;
                    let progressInfo = node.innerHTML.match(/progress_info_bold".+(\d+)/);
                    if (progressInfo) {
                        content = parseInt(progressInfo[1])
                    }
                    return content;
                })
            });

            document.querySelector("#es_badge_sort_value").addEventListener("click", async e => {

                if (this.context.hasMultiplePages) {
                    await this._loadAllPages();
                }

                this._sortBadgeRows(e.target.textContent, (node) => {
                    let content = 0;
                    let dropWorth = node.querySelector(".es_card_drop_worth");
                    if (dropWorth) {
                        content = parseFloat(dropWorth.dataset.esCardWorth);
                    }
                    return content;
                });
            });
        }
    }

    _addFilter() {

        let html  = `<span>${Localization.str.show}</span>
            <div class="store_nav">
                <div class="tab flyout_tab" id="es_filter_tab" data-flyout="es_filter_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                    <span class="pulldown">
                        <div id="es_filter_active" style="display: inline;">${Localization.str.badges_all}</div>
                        <span></span>
                    </span>
                </div>
            </div>
            <div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_filter_flyout" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;">
                <div class="popup_body popup_menu">
                    <a class="popup_menu_item es_bg_filter" id="es_badge_all">${Localization.str.badges_all}</a>
                    <a class="popup_menu_item es_bg_filter" id="es_badge_drops">${Localization.str.badges_drops}</a>
                </div>
            </div>`;

        HTML.afterBegin("#wishlist_sort_options",
            "<div class='es_badge_filter' style='float: right; margin-left: 18px;'>" + html + "</div>");

        document.querySelector("#es_badge_all").addEventListener("click", () => {
            for (let badge of document.querySelectorAll(".is_link")) {
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

            for (let node of document.querySelectorAll(".is_link")) {
                let progress = node.innerHTML.match(/progress_info_bold".+(\d+)/);
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

        let html = `<span>${Localization.str.view}</span>
            <div class="store_nav">
                <div class="tab flyout_tab" id="es_badgeview_tab" data-flyout="es_badgeview_flyout" data-flyout-align="right" data-flyout-valign="bottom">
                    <span class="pulldown">
                        <div id="es_badgeview_active" style="display: inline;">${Localization.str.theworddefault}</div>
                        <span></span>
                    </span>
                </div>
            </div>
            <div class="popup_block_new flyout_tab_flyout responsive_slidedown" id="es_badgeview_flyout" style="visibility: visible; top: 42px; left: 305px; display: none; opacity: 1;">
                <div class="popup_body popup_menu">
                    <a class="popup_menu_item es_bg_view" data-view="defaultview">${Localization.str.theworddefault}</a>
                    <a class="popup_menu_item es_bg_view" data-view="binderview">${Localization.str.binder_view}</a>
                </div>
            </div>`;

        HTML.afterBegin("#wishlist_sort_options",  "<div class='es_badge_view' style='float: right; margin-left: 18px;'>" + html + "</div>");

        // Change hash when selecting view
        document.querySelector("#es_badgeview_flyout").addEventListener("click", ({target}) => {
            let node = target.closest(".es_bg_view");
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

        let sheetNode = document.querySelector(".badges_sheet");

        // let images = Viewport.getVariableFromDom("g_rgDelayedLoadImages", "object");

        await this.context.eachBadgePage(dom => {
            let nodes = dom.querySelectorAll(".badge_row");
            for (let node of nodes) {
                sheetNode.append(node);
            }

            this.context.triggerCallbacks();

            // images = Object.assign(images, Viewport.getVariableFromDom("g_rgDelayedLoadImages", "object", dom));
        });

        let nodes = document.querySelectorAll(".profile_paging");
        for (let node of nodes) {
            node.style.display = "none";
        }

        // TODO this doesn't seem to work, can't figure out why right now. Lazy loader doesn't see updated object?
        // ExtensionLayer.runInPageContext("function(){g_rgDelayedLoadImages = " + JSON.stringify(images) + ";}");
        // resetLazyLoader();
    }

    _sortBadgeRows(activeText, nodeValueCallback) {
        let badgeRows = [];
        let nodes = document.querySelectorAll(".badge_row");
        for (let node of nodes) {
            badgeRows.push([node.outerHTML, nodeValueCallback(node)]);
            node.remove();
        }

        badgeRows.sort((a,b) => b[1] - a[1]);

        let sheetNode = document.querySelector(".badges_sheet");
        for (let row of badgeRows) {
            HTML.beforeEnd(sheetNode, row[0]);
        }

        this._resetLazyLoader();
        document.querySelector("#es_sort_active").textContent = activeText;
        document.querySelector("#es_sort_flyout").style.display = "none"; // TODO fadeout
    }

    _resetLazyLoader() {
        return; // FIXME this doesn't seem to work

        ExtensionLayer.runInPageContext(function() {
            // Clear registered image lazy loader watchers (CScrollOffsetWatcher is found in shared_global.js)
            CScrollOffsetWatcher.sm_rgWatchers = [];

            // Recreate registered image lazy loader watchers
            $J('div[id^=image_group_scroll_badge_images_gamebadge_]').each(function(i,e){
                // LoadImageGroupOnScroll is found in shared_global.js
                LoadImageGroupOnScroll(e.id, e.id.substr(19));
            });
        });
    }

    _toggleBinderView() {

        if (window.location.hash === "#binderview") {
            document.querySelector("div.maincontent").classList.add("es_binder_view");

            let mainNode = document.querySelector("div.maincontent");

            // Don't attempt changes again if already loaded
            if (!mainNode.classList.contains("es_binder_loaded")) {
                mainNode.classList.add("es_binder_loaded");

                for (let node of document.querySelectorAll("div.badge_row.is_link")) {
                    let stats = node.querySelector("span.progress_info_bold");
                    if (stats && stats.innerHTML.match(/\d+/)) {
                        HTML.beforeEnd(node.querySelector("div.badge_content"),
                            "<span class='es_game_stats'>" + stats.outerHTML + "</span>");
                    }

                    let infoNode = node.querySelector("div.badge_progress_info");
                    if (infoNode) {
                        let card = infoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                        let text = (card) ? card[1] + " / " + card[2] : '';
                        HTML.beforeBegin(infoNode,  '<div class="es_badge_progress_info">' + text + '</div>');
                    }
                }
            }

            // Add hash to pagination links
            for (let node of document.querySelectorAll("div.pageLinks a.pagelink, div.pageLinks a.pagebtn")) {
                node.href = node.href + "#binderview";
            }

            // Triggers the loading of out-of-view badge images
            window.dispatchEvent(new Event("resize"));
            document.querySelector("#es_badgeview_active").textContent = Localization.str.binder_view;
        } else {
            document.querySelector("div.maincontent").classList.remove("es_binder_view");

            for (let node of document.querySelectorAll("div.pageLinks a.pagelink, div.pageLinks a.pagebtn")) {
                node.href = node.href.replace("#binderview", "");
            }

            document.querySelector("#es_badgeview_active").textContent = Localization.str.theworddefault;
        }
    }
}
