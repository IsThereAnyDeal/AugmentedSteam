import { ASFeature } from "../../ASFeature.js";
import { Background, DOMHelper, User } from "../../common.js";
import { HTML, HTMLParser, SyncedStorage } from "../../../core.js";
import { Localization } from "../../../language.js";

export class FBadgeProgress extends ASFeature {

    checkPrerequisites() {
        return this.context.hasCards && User.isSignedIn && SyncedStorage.get("show_badge_progress");
    }

    apply() {

        DOMHelper.insertStylesheet("//steamcommunity-a.akamaihd.net/public/css/skin_1/badges.css");

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

        let appid = this.context.communityAppid;

        return Promise.all([
            Background.action("cards", appid)
                .then(result => { this._loadBadgeContent(".es_normal_badge_progress", result) }),
            Background.action("cards", appid, true)
                .then(result => { this._loadBadgeContent(".es_foil_badge_progress", result) }),
        ]);
    }

    _loadBadgeContent(targetSelector, result) {
        let dummy = HTMLParser.htmlToDOM(result);

        // grap badge and game cards
        // when there is no badge (e.g. dlc), badge_gamecard_page class won't appear
        let badge = dummy.querySelector(".badge_gamecard_page");
        if (badge) {
            this._displayBadgeInfo(targetSelector, badge);
        } else {
            if (document.getElementById("es_badge_progress")) {
                document.getElementById("es_badge_progress").remove();
                document.getElementById("es_badge_progress_content").remove();
            }
        }
    }

    _displayBadgeInfo(targetSelector, badgeNode) {
        let blockSel = document.querySelector(targetSelector);

        // show Steam badge info card
        let badge = badgeNode.querySelector(".badge_current");
        blockSel.append(badge);

        // count card
        let card_num_owned = badgeNode.querySelectorAll(".badge_detail_tasks .owned").length;
        let card_num_total = badgeNode.querySelectorAll(".badge_detail_tasks .badge_card_set_card").length;
        // check if badge is completed
        let progress = badgeNode.querySelector(".gamecard_badge_progress");
        let progress_text_length = progress ? progress.textContent.trim().length : 0;
        let next_level_empty_badge = badgeNode.querySelectorAll(".gamecard_badge_progress .badge_info").length;
        let badge_completed = (progress_text_length > 0 && next_level_empty_badge === 0);

        let show_card_num = (card_num_owned > 0 && !badge_completed);
        let is_normal_badge = targetSelector === ".es_normal_badge_progress";

        if (is_normal_badge || (card_num_owned > 0 || !blockSel.querySelector(".badge_empty_circle"))) {
            blockSel.parentNode.style.display = "block";
            blockSel.style.display = "block";

            let progressBold = badgeNode.querySelector(".progress_info_bold");

            HTML.beforeEnd(blockSel,
                `<div class="es_cards_numbers">
                    <div class="es_cards_remaining">${progressBold ? progressBold.textContent : ""}</div>
                </div>
                <div class="game_area_details_specs">
                    <div class="icon"><img src="//store.steampowered.com/public/images/v6/ico/ico_cards.png" class="category_icon"></div>
                    <a href="//steamcommunity.com/my/gamecards/${this.context.communityAppid}${is_normal_badge ? '/' : '?border=1'}" class="name">${badge_completed ? Localization.str.view_badge : Localization.str.view_badge_progress}</a>
                </div>`);

            if (show_card_num) {
                HTML.beforeEnd(blockSel.querySelector(".es_cards_numbers"),
                    `<div class="es_cards_owned">${Localization.str.cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total)}</div>`);
            }

            let last = blockSel.querySelector(".badge_empty_right div:last-child");
            if (last) {
                last.classList.add("badge_empty_name");
                last.style = "";
                last.textContent = Localization.str.badge_not_unlocked;
            }
        }
    }
}
