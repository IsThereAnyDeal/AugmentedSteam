import {L} from "@Core/Localization/Localization";
import {__moreOnSteampeek} from "@Strings/_strings";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import LocalStorage from "@Core/Storage/LocalStorage";
import DOMHelper from "@Content/Modules/DOMHelper";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
import "./FSteamPeek.css";

export default class FSteamPeek extends Feature<CApp> {

    private _moreLikeThis: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        this._moreLikeThis = document.querySelector("#recommended_block");
        return this._moreLikeThis !== null;
    }

    async apply(): Promise<void> {
        if (!this._moreLikeThis) {
            return;
        }

        HTML.afterEnd(this._moreLikeThis.querySelector(".block_header"),
            `<div class="es_tabs">
                <div class="home_tabs_row">
                    <div id="es_tab_steamsimilar" class="es_tab home_tab active">
                        <div class="tab_content">Steam</div>
                    </div>
                    <div id="es_tab_steampeek" class="es_tab home_tab">
                        <div class="tab_content">SteamPeek</div>
                    </div>
                </div>
            </div>`);

        const steamTab = this._moreLikeThis.querySelector("#es_tab_steamsimilar")!;
        const steamPeekTab = this._moreLikeThis.querySelector<HTMLElement>("#es_tab_steampeek")!;
        const content = this._moreLikeThis.querySelector("#recommended_block_content")!;

        steamTab.addEventListener("click", () => {
            steamPeekTab.classList.remove("active");
            steamTab.classList.add("active");
            content.classList.remove("es_sp_active");
            content.classList.add("es_steam_active");

            LocalStorage.set("steampeek", false);

            this._adjustScroller();
        });

        let spLoaded = false;
        steamPeekTab.addEventListener("click", async() => {
            steamPeekTab.classList.add("active");
            steamTab.classList.remove("active");
            content.classList.add("es_sp_active");
            content.classList.remove("es_steam_active");

            LocalStorage.set("steampeek", true);

            if (!spLoaded) {
                spLoaded = true;

                for (const node of content.querySelectorAll(":scope > a")) {
                    node.classList.add("es_steam_similar");
                }

                const data = await AugmentedSteamApiFacade.fetchSteamPeek(this.context.appid);
                if (!data) { return; }

                const lastChild = content.querySelector(":scope > :last-child");

                for (const {title, appid} of data) {
                    HTML.beforeBegin(lastChild,
                        `<a class="small_cap es_sp_similar" data-ds-appid="${appid}" href="https://store.steampowered.com/app/${appid}/">
                            <img src="//cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_184x69.jpg" class="small_cap_img">
                            <h4>${title}</h4>
                        </a>`);
                }

                DOMHelper.insertScript("scriptlets/Store/App/SteamPeek/decorateItems.js", {appids: data.map(({appid}) => appid)});
                this.context.decorateStoreCapsules(content.querySelectorAll<HTMLAnchorElement>("a.es_sp_similar"));

                HTML.beforeBegin(lastChild,
                    `<a class="small_cap es_sp_similar" href="http://steampeek.hu/?appid=${this.context.appid}" target="_blank">
                        <div class="es_sp_similar__link">${L(__moreOnSteampeek)}</div>
                    </a>`);
            }

            this._adjustScroller();
        });

        if (await LocalStorage.get("steampeek")) {
            steamPeekTab.click();
        }
    }

    private _adjustScroller() {
        DOMHelper.insertScript("scriptlets/Store/App/SteamPeek/adjustScroller.js");
    }
}
