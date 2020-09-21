import {ASFeature} from "modules";

import {SyncedStorage} from "core";

export class FHideActiveListings extends ASFeature {

    checkPrerequisites() {
        return SyncedStorage.get("hideactivelistings");
    }

    apply() {

        document.querySelector("#tabContentsMyListings").style.display = "none";

        let node = document.querySelector("#tabMyListings");
        node.classList.remove("market_tab_well_tab_active");
        node.classList.add("market_tab_well_tab_inactive");
    }
}
