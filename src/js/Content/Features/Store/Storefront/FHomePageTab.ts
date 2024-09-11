import Feature from "@Content/Modules/Context/Feature";
import type CStoreFront from "@Content/Features/Store/Storefront/CStoreFront";
import SyncedStorage from "@Core/Storage/SyncedStorage";
import Settings from "@Options/Data/Settings";

export default class FHomePageTab extends Feature<CStoreFront> {

    override async apply(): Promise<void> {

        const rowParent = document.querySelector(".home_tabs_row");
        if (!rowParent) {
            throw new Error("Node not found");
        }

        rowParent.addEventListener("click", () => {
            const tab = rowParent.querySelector(".home_tab.active");
            if (!tab) { return; }

            SyncedStorage.set("homepage_tab_last", tab.id);
        });

        const setting = Settings.homepage_tab_selection;
        const tabId: string|null = setting === "remember"
            ? (await SyncedStorage.get("homepage_tab_last")) ?? null
            : setting;

        if (!tabId) { return; }

        rowParent.querySelector<HTMLElement>(`#${tabId}`)?.click();
    }
}
