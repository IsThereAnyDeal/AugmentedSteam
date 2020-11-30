import {SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FRemoveBroadcasts extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("removebroadcasts");
    }

    apply() {
        document.getElementById("application_root").remove();
    }
}
