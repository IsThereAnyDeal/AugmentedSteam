import {Background, DOMHelper, Feature, User} from "../../../modulesContent";
import {HTML, HTMLParser, Localization, SyncedStorage} from "../../../../modulesCore";

export default class FBadgeProgress extends Feature {

    checkPrerequisites() {
        return this.context.hasCards && User.isSignedIn && SyncedStorage.get("show_badge_progress");
    }

    async apply() {

        DOMHelper.insertStylesheet("//community.akamai.steamstatic.com/public/css/skin_1/badges.css");

        HTML.afterEnd("#category_block",
            `<div id="es_badge_progress" class="block responsive_apppage_details_right heading">
                ${Localization.str.badge_progress}
            </div>
            <div id="es_badge_progress_content" class="block responsive_apppage_details_right">
                <div class="block_content_inner es_badges_progress_block" style="display:none;">
                    <div class="es_normal_badge_progress es_progress_block" style="display:none;"></div>
                    <div class="es_foil_badge_progress es_progress_block" style="display:none;"></div>
                </div>
            </div>`);

        const appid = this.context.communityAppid;

        try {
            await Promise.all([
                Background.action("cards", appid)
                    .then(result => { this._loadBadgeContent(".es_normal_badge_progress", result); }),
                Background.action("cards", appid, true)
                    .then(result => { this._loadBadgeContent(".es_foil_badge_progress", result); }),
            ]);
        } catch (err) {
            document.getElementById("es_badge_progress").remove();
            document.getElementById("es_badge_progress_content").remove();
            throw err;
        }
    }

    _loadBadgeContent(targetSelector, result) {
        const dummy = HTMLParser.htmlToDOM(result);

        /*
         * grap badge and game cards
         * when there is no badge (e.g. dlc), badge_gamecard_page class won't appear
         */
        const badge = dummy.querySelector(".badge_gamecard_page");
        if (badge) {
            this._displayBadgeInfo(targetSelector, badge);
        } else {
            document.getElementById("es_badge_progress").remove();
            document.getElementById("es_badge_progress_content").remove();
        }
    }

    _displayBadgeInfo(targetSelector, badgeNode) {
        const blockSel = document.querySelector(targetSelector);

        // show Steam badge info card
        const badge = badgeNode.querySelector(".badge_current");
        blockSel.append(badge);

        // count card
        const cardNumOwned = badgeNode.querySelectorAll(".badge_detail_tasks .owned").length;
        const cardNumTotal = badgeNode.querySelectorAll(".badge_detail_tasks .badge_card_set_card").length;

        // check if badge is completed
        const progress = badgeNode.querySelector(".gamecard_badge_progress");
        const progressTextLength = progress ? progress.textContent.trim().length : 0;
        const nextLevelEmptyBadge = badgeNode.querySelectorAll(".gamecard_badge_progress .badge_info").length;
        const badgeCompleted = (progressTextLength > 0 && nextLevelEmptyBadge === 0);

        const showCardNum = (cardNumOwned > 0 && !badgeCompleted);
        const isNormalBadge = targetSelector === ".es_normal_badge_progress";

        if (isNormalBadge || (cardNumOwned > 0 || !blockSel.querySelector(".badge_empty_circle"))) {
            blockSel.parentNode.style.display = "block";
            blockSel.style.display = "block";

            const progressBold = badgeNode.querySelector(".progress_info_bold");

            HTML.beforeEnd(blockSel,
                `<div class="es_cards_numbers">
                    <div class="es_cards_remaining">${progressBold ? progressBold.textContent : ""}</div>
                </div>
                <div class="game_area_details_specs">
                    <div class="icon"><img src="//store.steampowered.com/public/images/v6/ico/ico_cards.png" class="category_icon"></div>
                    <a href="//steamcommunity.com/my/gamecards/${this.context.communityAppid}${isNormalBadge ? "/" : "?border=1"}" class="name">${badgeCompleted ? Localization.str.view_badge : Localization.str.view_badge_progress}</a>
                </div>`);

            if (showCardNum) {
                HTML.beforeEnd(blockSel.querySelector(".es_cards_numbers"),
                    `<div class="es_cards_owned">${Localization.str.cards_owned.replace("__owned__", cardNumOwned).replace("__possible__", cardNumTotal)}</div>`);
            }

            const last = blockSel.querySelector(".badge_empty_right div:last-child");
            if (last) {
                last.classList.add("badge_empty_name");
                last.style = "";
                last.textContent = Localization.str.badge_not_unlocked;
            }
        }
    }
}
