import {HTML, Localization} from "../../../core_modules";
import {Feature, RequestData} from "../../../Modules/content";
import {CommunityCommon} from "community/common";

export default class FBadgeDropsCount extends Feature {

    checkPrerequisites() {
        return CommunityCommon.currentUserIsOwner();
    }

    apply() {
        this._updateHead();
        this._addDropsCount();
    }

    _updateHead() {

        // move faq to the middle
        const xpBlockRight = document.querySelector(".profile_xp_block_right");

        HTML.beforeEnd(
            document.querySelector(".profile_xp_block_mid"),
            `<div class='es_faq_cards'>${xpBlockRight.innerHTML}</div>`
        );
        xpBlockRight.innerHTML = "<div id='es_cards_worth'></div>";
    }

    _addDropsCount() {

        let dropsCount = 0;
        let dropsGames = 0;
        let completed = false;

        function countDropsFromDOM(dom) {
            const nodes = dom.querySelectorAll(".badge_title_stats_drops .progress_info_bold");
            for (const node of nodes) {
                const count = node.innerText.match(/(\d+)/);
                if (!count) { continue; }

                dropsGames++;
                dropsCount += parseInt(count[1]);
            }
        }

        async function addDropsCount() {
            HTML.inner(
                "#es_calculations",
                `${Localization.str.card_drops_remaining.replace("__drops__", dropsCount)
                }<br>${Localization.str.games_with_drops.replace("__dropsgames__", dropsGames)}`
            );

            let response;
            try {
                response = await RequestData.getHttp("https://steamcommunity.com/my/ajaxgetboostereligibility/");
            } catch (exception) {
                console.error("Failed to load booster eligibility", exception);
                return;
            }

            const boosterGames = response.match(/class="booster_eligibility_game"/g);
            const boosterCount = (boosterGames && boosterGames.length) || 0;

            HTML.beforeEnd("#es_calculations",
                `<br>${Localization.str.games_with_booster.replace("__boostergames__", boosterCount)}`);
        }

        countDropsFromDOM(document);

        if (this.context.hasMultiplePages) {
            HTML.afterBegin(".profile_xp_block_right", `<div id='es_calculations'><div class='btn_grey_black btn_small_thin'><span>${Localization.str.drop_calc}</span></div></div>`);

            document.querySelector("#es_calculations").addEventListener("click", async() => {
                if (completed) { return; }

                document.querySelector("#es_calculations").textContent = Localization.str.loading;

                await this.context.eachBadgePage(countDropsFromDOM);

                // TODO triggerCallbacks ?
                addDropsCount();
                completed = true;
            });

        } else {
            HTML.afterBegin(".profile_xp_block_right",
                `<div id='es_calculations'>${Localization.str.drop_calc}</div>`);

            addDropsCount();
        }
    }
}
