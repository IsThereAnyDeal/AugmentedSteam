import AppId from "@Core/GameId/AppId";
import Settings from "@Options/Data/Settings";
import ExtensionResources from "@Core/ExtensionResources";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import type {CBadges} from "@Content/Features/Community/Badges/CBadges";

export default class FCardExchangeLinks<T extends CBadges & {appid?: number}> extends Feature<T> {

    override checkPrerequisites(): boolean {
        return Settings.steamcardexchange;
    }

    public override apply(): void | Promise<void> {
        document.addEventListener("as_pageUpdated", () => this.onPageUpdated());
    }

    private onPageUpdated() {
        const ceImg = ExtensionResources.getURL("img/ico/steamcardexchange.png");

        for (const node of document.querySelectorAll<HTMLElement>(".badge_row:not(.es-has-ce-link)")) {
            let appid: number|undefined;
            if ("appid" in this.context) {
                appid = this.context.appid;
            } else {
                const overlay = node.querySelector<HTMLAnchorElement>("a.badge_row_overlay");
                if (overlay) {
                    AppId.fromGameCardUrl(overlay.href);
                }
            }
            if (!appid) { continue; }

            HTML.afterBegin(node,
                `<div class="es_steamcardexchange_link">
                    <a href="https://www.steamcardexchange.net/index.php?gamepage-appid-${appid}/" target="_blank" title="Steam Card Exchange">
                        <img src="${ceImg}" alt="Steam Card Exchange">
                    </a>
                </div>`);

            node.classList.add("es-has-ce-link");
        }
    }
}
