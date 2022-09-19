import {LocalStorage, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FForceMP4 extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("mp4video");
    }

    apply() {

        const playInHD = LocalStorage.get("playback_hd");

        for (const node of document.querySelectorAll("[data-webm-source]")) {
            const mp4 = node.dataset.mp4Source;
            const mp4hd = node.dataset.mp4HdSource;
            if (!mp4 || !mp4hd) { continue; }

            node.dataset.webmSource = mp4;
            node.dataset.webmHdSource = mp4hd;

            const videoEl = node.querySelector("video");
            if (!videoEl) { continue; }

            videoEl.dataset.hdSrc = mp4hd;
            this.context.toggleVideoDefinition(videoEl, playInHD, true);
        }
    }
}
