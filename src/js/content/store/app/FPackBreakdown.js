import {ASFeature} from "../../ASFeature.js";
import {HTML} from "../../../core.js";
import {Localization} from "../../../language.js";
import {Price} from "../../common.js";

export class FPackBreakdown extends ASFeature {

    apply() {

        for (const node of document.querySelectorAll(".game_area_purchase_game_wrapper:not(.bundle_hidden_by_preferences)")) {

            // prevent false positives on packages e.g. Doom 3
            if (node.querySelector(".btn_packageinfo")) { continue; }

            let title = node.querySelector("h1").textContent;
            title = title.toLowerCase().replace(/-/g, " ");

            let text = "";
            if (node.querySelector("p")) {
                text = node.querySelector("p").textContent;
            }

            if (title.includes("2 pack")
                || title.includes("two pack")
                || title.includes("tower wars friend pack")
                || text.includes("gift copy")
                || text.includes("extra copy")) { this._splitPack(node, 2); } else if (title.includes("3 pack")
                || title.includes("three pack")
                || title.includes("tower wars team pack")) { this._splitPack(node, 3); } else if (title.includes("4 pack")
                || title.includes("four pack")
                || title.includes("clan pack")) { this._splitPack(node, 4); } else if (title.includes("5 pack")
                || title.includes("five pack")) { this._splitPack(node, 5); } else if (title.includes("6 pack")
                || title.includes("six pack")) { this._splitPack(node, 6); }
        }
    }

    _splitPack(node, ways) {
        let price_text = node.querySelector(".game_purchase_price, .discount_final_price").textContent;
        if (price_text.match(/,\d\d(?!\d)/)) {
            price_text = price_text.replace(",", ".");
        }
        let price = (Number(price_text.replace(/[^0-9\.]+/g, ""))) / ways;
        price = new Price(Math.ceil(price * 100) / 100);

        HTML.afterBegin(node.querySelector(".game_purchase_action_bg"),
            `<div class="es_each_box">
                <div class="es_each_price">${price}</div>
                <div class="es_each">${Localization.str.each}</div>
            </div>`);
    }
}
