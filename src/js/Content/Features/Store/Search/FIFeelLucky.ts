import Feature from "@Content/Modules/Context/Feature";
import type CSearch from "@Content/Features/Store/Search/CSearch";
import Settings from "@Options/Data/Settings";

export default class FIFeelLucky extends Feature<CSearch> {

    override async isEnabled(): Promise<boolean> {
        return Settings.context_steam_lucky;
    }

    override async apply(): Promise<null> {
        if ((new URLSearchParams(window.location.search ?? "")).has("ifeellucky")) {
            const firstResult = document.querySelector<HTMLAnchorElement>("a.search_result_row");
            if (firstResult && firstResult.href) {
                window.location.href = firstResult.href;
            }
        }
        return null;
    }
}
