import {ASFeature} from "modules/ASFeature";
import {SyncedStorage} from "core";

export class FHomePageTab extends ASFeature {

    apply() {
        document.querySelector(".home_tabs_row").addEventListener("click", ({target}) => {
            const tab = target.closest(".tab_content");
            if (!tab) { return; }
            SyncedStorage.set("homepage_tab_last", tab.parentNode.id);
        });

        const setting = SyncedStorage.get("homepage_tab_selection");
        let last = setting;
        if (setting === "remember") {
            last = SyncedStorage.get("homepage_tab_last");
        }
        if (!last) { return; }

        const tab = document.querySelector(`.home_tabs_row #${last}`);
        if (!tab) { return; }

        tab.click();
    }
}
