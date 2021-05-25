import {Feature} from "../../../modulesContent";
import {HTML, Localization} from "../../../../modulesCore";

export default class FDemoAbovePurchase extends Feature {

    checkPrerequisites() {
        const rightcolDemoBtn = document.querySelector(".rightcol.game_meta_data a[href^='javascript:ShowGotSteamModal'], .rightcol.game_meta_data a[href^='steam://install']");
        this._demoLink = rightcolDemoBtn && rightcolDemoBtn.href.match(/steam:\/\/install\/\d+/);

        return Boolean(this._demoLink) && document.querySelector(".demo_above_purchase") === null;
    }

    apply() {

        // Determine available platforms from the system requirments section
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
                    <div class="btn_addtocart">
                        <a class="btn_green_steamui btn_medium" href="${this._demoLink[0]}">
                            <span>${Localization.str.export.download}</span>
                        </a>
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
    }
}
