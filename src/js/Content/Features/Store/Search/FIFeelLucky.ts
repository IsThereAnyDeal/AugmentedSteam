import Feature from "@Content/Modules/Context/Feature";
import type CSearch from "@Content/Features/Store/Search/CSearch";

export default class FIFeelLucky extends Feature<CSearch> {

    override checkPrerequisites(): boolean | Promise<boolean> {
        return (new URLSearchParams(window.location.search ?? ""))
            .has("ifeellucky");
    }

    override apply(): void {
        const firstResult = document.querySelector<HTMLAnchorElement>("a.search_result_row");
        if (firstResult && firstResult.href) {
            window.location.href = firstResult.href;
        }
    }
}
