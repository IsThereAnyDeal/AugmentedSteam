import Feature from "@Content/Modules/Context/Feature";
import CStoreFront from "@Content/Features/Store/Storefront/CStoreFront";
import SyncedStorage from "@Core/Storage/SyncedStorage";
import Settings from "@Options/Data/Settings";

export default class FHomePageTab extends Feature<CStoreFront> {

    override async apply(): Promise<void> {
        document.querySelector(".home_tabs_row")
            ?.addEventListener("click", e => {
                const tab = (<Element>e.target).closest(".tab_content");
                if (!tab) { return; }

                SyncedStorage.set("homepage_tab_last", (<HTMLElement>tab.parentNode).id);
            });

        const setting = Settings.homepage_tab_selection;
        let last: string|null = setting;
        if (setting === "remember") {
            last = (await SyncedStorage.get("homepage_tab_last")) ?? null;
        }
        if (!last) { return; }

        const tab = document.querySelector<HTMLElement>(`.home_tabs_row #${last}`);
        if (!tab) { return; }

        tab.click();
    }
}
