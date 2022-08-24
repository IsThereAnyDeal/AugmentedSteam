import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FDemoAbovePurchase extends Feature {

    checkPrerequisites() {
        this._demoLink = document.querySelector(".download_demo_button a.btn_medium")?.href.slice(11); // strip leading "javascript:"

        // Check if there's a demo link in the right column, but no demo-above-purchase section
        return Boolean(this._demoLink) && document.querySelector(".demo_above_purchase") === null;
    }

    apply() {

        // Determine available platforms from system requirements
        const winIcon = document.querySelector("[data-os=win]") ? '<span class="platform_img win"></span>' : "";
        const macIcon = document.querySelector("[data-os=mac]") ? '<span class="platform_img mac"></span>' : "";
        const linuxIcon = document.querySelector("[data-os=linux]") ? '<span class="platform_img linux"></span>' : "";

        const html = `<div class="game_area_purchase_game demo_above_purchase">
            <div class="game_area_purchase_platform">
                ${winIcon}${macIcon}${linuxIcon}
            </div>
            <h1>${Localization.str.download_demo_header.replace("__gamename__", this.context.appName)}</h1>
            <div class="game_purchase_action">
                <div class="game_purchase_action_bg">
                    <div id="demoGameBtn" class="btn_addtocart">
                        <span class="btn_green_steamui btn_medium">
                            <span>${Localization.str.export.download}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>`;

        const purchaseNote = document.getElementById("purchase_note");
        if (purchaseNote) {
            HTML.afterEnd(purchaseNote, html);
        } else {
            HTML.afterBegin(document.getElementById("game_area_purchase"), html);
        }

        // Prevent sanitizing inline javascript (comes from page, safe source)
        document.querySelector("#demoGameBtn > .btn_green_steamui").setAttribute("onclick", this._demoLink);
    }
}
