import {HTML, Localization} from "../../../../modulesCore";
import {Background, CallbackFeature, CommunityUtils, CurrencyManager, DOMHelper, Price} from "../../../modulesContent";

// TODO Split up
export default class FBadgeCompletionCost extends CallbackFeature {

    checkPrerequisites() {
        return CommunityUtils.currentUserIsOwner();
    }

    setup() {
        this.callback();
    }

    async callback() {

        const appids = [];
        const nodes = [];
        const foilAppids = [];

        const rows = document.querySelectorAll(".badge_row.is_link:not(.esi-badge)");
        for (const node of rows) {
            const game = node.querySelector(".badge_row_overlay").href.match(/gamecards\/(\d+)\//);
            if (!game) { continue; }
            const appid = parseInt(game[1]);

            const foil = /\?border=1/.test(node.querySelector("a:last-of-type").href);
            nodes.push([appid, node, foil]);

            if (foil) {
                foilAppids.push(appid);
            } else {
                appids.push(appid);
            }
        }

        if (appids.length === 0 && foilAppids.length === 0) {
            return;
        }

        let data;
        try {
            data = await Background.action("market.averagecardprices", {
                "currency": CurrencyManager.storeCurrency,
                "appids": appids.join(","),
                "foilappids": foilAppids.join(","),
            });
        } catch (exception) {
            console.error("Couldn't retrieve average card prices", exception);
            return;
        }

        // regular cards
        for (const item of nodes) {
            const appid = item[0];
            const node = item[1];
            const isFoil = item[2];

            const key = isFoil ? "foil" : "regular";
            if (!data[appid] || !data[appid][key]) { continue; }

            const averagePrice = data[appid][key].average;

            let cost;
            const progressInfoNode = node.querySelector("div.badge_progress_info");
            if (progressInfoNode) {
                const card = progressInfoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                if (card) {
                    const need = card[2] - card[1];
                    cost = new Price(averagePrice * need);
                }
            }

            if (!isFoil) {
                this._addRemainingDropsWorth(node, averagePrice);
            }

            if (cost) {
                const badgeNameBox = DOMHelper.selectLastNode(node, ".badge_empty_name");
                if (badgeNameBox) {
                    HTML.afterEnd(
                        badgeNameBox,
                        `<div class="badge_info_unlocked">
                            ${Localization.str.badge_completion_avg.replace("__cost__", cost)}
                        </div>`
                    );
                }
            }

            // note CSS styles moved to .css instead of doing it in javascript
            node.classList.add("esi-badge");
        }

        document.querySelector("#es_cards_worth").innerText = `${Localization.str.drops_worth_avg} ${new Price(this._totalWorth)}`;
    }

    _addRemainingDropsWorth(node, averagePrice) {

        const progressBoldNode = node.querySelector(".progress_info_bold");
        if (!progressBoldNode) { return; }

        const drops = progressBoldNode.textContent.match(/\d+/);
        if (!drops) { return; }

        const worth = new Price(drops[0] * averagePrice);
        if (worth.value <= 0) { return; }

        this._totalWorth += worth.value;

        HTML.replace(node.querySelector(".how_to_get_card_drops"),
            `<span class="es_card_drop_worth" data-es-card-worth="${worth.value}">${Localization.str.drops_worth_avg} ${worth}</span>`);
    }
}
