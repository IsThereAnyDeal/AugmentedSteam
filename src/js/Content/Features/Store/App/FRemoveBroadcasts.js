import {SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FRemoveBroadcasts extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("removebroadcasts")
            && document.querySelector("[data-featuretarget=broadcast-embed]") !== null;
    }

    apply() {

        document.querySelector("[data-featuretarget=broadcast-embed]").remove();

        Page.runInPageContext(() => {
            const bcStore = window.uiBroadcastWatchStore;
            if (bcStore && bcStore.m_activeVideo) {
                // eslint-disable-next-line new-cap
                bcStore.StopVideo(bcStore.m_activeVideo);
            }
        });
    }
}
