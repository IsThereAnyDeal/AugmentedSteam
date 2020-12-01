import {SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FRemoveBroadcasts extends Feature {

    checkPrerequisites() {
        if (!SyncedStorage.get("removebroadcasts")) { return false; }

        const el = document.querySelector('#game_highlights > [data-featuretarget="broadcast-embed"]');
        if (el === null) { return false; }

        this._el = el;
        return true;
    }

    apply() {
        this._el.remove();

        Page.runInPageContext(() => {
            const bcStore = window.uiBroadcastWatchStore;
            if (bcStore && bcStore.m_activeVideo) {
                bcStore.StopVideo(bcStore.m_activeVideo);
            }
        });
    }
}
