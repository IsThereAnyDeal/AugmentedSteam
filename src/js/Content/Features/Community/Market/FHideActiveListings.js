import {Feature} from "../../../Modules/Feature/Feature";
import {SyncedStorage} from "../../../../modulesCore";

export default class FHideActiveListings extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("hideactivelistings");
    }

    apply() {

        document.querySelector("#tabContentsMyListings").style.display = "none";

        const node = document.querySelector("#tabMyListings");
        node.classList.remove("market_tab_well_tab_active");
        node.classList.add("market_tab_well_tab_inactive");
    }
}
