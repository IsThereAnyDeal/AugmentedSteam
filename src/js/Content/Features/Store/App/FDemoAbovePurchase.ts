import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";
import {__downloadDemoHeader, __export_download} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import HTML from "@Core/Html/Html";

/*
 * Try out with https://store.steampowered.com/app/220/HalfLife_2/
 * TODO Add "Add to Library" button
 */

export default class FDemoAbovePurchase extends Feature<CApp> {

    private _demoLink: string|null = null;

    override checkPrerequisites(): boolean {
        // strip leading "javascript:"
        this._demoLink = document.querySelector<HTMLAnchorElement>(".download_demo_button a.btn_medium")?.href.slice(11) ?? null;

        // Check if there's a demo link in the right column, but no demo-above-purchase section
        return Boolean(this._demoLink) && document.querySelector(".demo_above_purchase") === null;
    }

    override apply(): void {

        // Determine available platforms from system requirements
        const winIcon = document.querySelector("[data-os=win]") ? '<span class="platform_img win"></span>' : "";
        const macIcon = document.querySelector("[data-os=mac]") ? '<span class="platform_img mac"></span>' : "";
        const linuxIcon = document.querySelector("[data-os=linux]") ? '<span class="platform_img linux"></span>' : "";

        const html = `<div class="game_area_purchase_game demo_above_purchase">
            <div class="game_area_purchase_platform">
                ${winIcon}${macIcon}${linuxIcon}
            </div>
            <h1>${L(__downloadDemoHeader, {"gamename": this.context.appName})}</h1>
            <div class="game_purchase_action">
                <div class="game_purchase_action_bg">
                    <div id="demoGameBtn" class="btn_addtocart">
                        <span class="btn_green_steamui btn_medium">
                            <span>${L(__export_download)}</span>
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
        document.querySelector("#demoGameBtn > .btn_green_steamui")!.setAttribute("onclick", this._demoLink!);
    }
}
