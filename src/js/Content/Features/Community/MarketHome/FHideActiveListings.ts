import type CMarketHome from "@Content/Features/Community/MarketHome/CMarketHome";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";

export default class FHideActiveListings extends Feature<CMarketHome> {

    override checkPrerequisites(): boolean {
        return Settings.hideactivelistings;
    }

    override apply(): void {

        document.querySelector<HTMLElement>("#tabContentsMyListings")!.style.display = "none";

        const node = document.querySelector<HTMLElement>("#tabMyListings")!;
        node.classList.remove("market_tab_well_tab_active");
        node.classList.add("market_tab_well_tab_inactive");
    }
}
