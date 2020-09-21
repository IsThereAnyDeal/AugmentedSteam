import {CallbackFeature} from "modules";

import {HTML, Localization} from "core";
import {Background, Currency, DOMHelper, Price} from "common";
import {CommunityCommon} from "community/common";

// TODO Split up
export class FBadgeCompletionCost extends CallbackFeature {

    checkPrerequisites() {
        return CommunityCommon.currentUserIsOwner();
    }

    async callback() {

        let appids = [];
        let nodes = [];
        let foilAppids = [];

        let rows = document.querySelectorAll(".badge_row.is_link:not(.esi-badge)");
        for (let node of rows) {
            let game = node.querySelector(".badge_row_overlay").href.match(/gamecards\/(\d+)\//);
            if (!game) { continue; }
            let appid = parseInt(game[1]);

            let foil = /\?border=1/.test(node.querySelector("a:last-of-type").href);
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
                currency: Currency.storeCurrency,
                appids: appids.join(","),
                foilappids: foilAppids.join(","),
            });
        } catch (exception) {
            console.error("Couldn't retrieve average card prices", exception);
            return;
        }

        // regular cards
        for (let item of nodes) {
            let appid = item[0];
            let node = item[1];
            let isFoil = item[2];

            let key = isFoil ? "foil" : "regular";
            if (!data[appid] || !data[appid][key]) { continue; }

            let averagePrice = data[appid][key]['average'];

            let cost;
            let progressInfoNode = node.querySelector("div.badge_progress_info");
            if (progressInfoNode) {
                let card = progressInfoNode.textContent.trim().match(/(\d+)\D*(\d+)/);
                if (card) {
                    let need = card[2] - card[1];
                    cost = new Price(averagePrice * need);
                }
            }

            if (!isFoil) {
                let progressBoldNode = node.querySelector(".progress_info_bold");
                if (progressBoldNode) {
                    let drops = progressBoldNode.textContent.match(/\d+/);
                    if (drops) {
                        let worth = new Price(drops[0] * averagePrice);

                        if (worth.value > 0) {
                            this._totalWorth += worth.value;

                            HTML.replace(node.querySelector(".how_to_get_card_drops"),
                                `<span class='es_card_drop_worth' data-es-card-worth='${worth.value}'>${Localization.str.drops_worth_avg} ${worth}</span>`);
                        }
                    }
                }
            }

            if (cost) {
                let badgeNameBox = DOMHelper.selectLastNode(node, ".badge_empty_name");
                if (badgeNameBox) {
                    HTML.afterEnd(badgeNameBox, "<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + Localization.str.badge_completion_avg.replace("__cost__", cost) + "</div>");
                }
            }

            // note CSS styles moved to .css instead of doing it in javascript
            node.classList.add("esi-badge");
        }

        document.querySelector("#es_cards_worth").innerText = Localization.str.drops_worth_avg + " " + new Price(this._totalWorth);
    }
}
