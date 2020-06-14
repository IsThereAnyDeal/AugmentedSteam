import { ASFeature } from "../../ASFeature.js";
import { SyncedStorage } from "../../../core.js";

export class FForceMP4 extends ASFeature {
    checkPrerequisites() {
        return SyncedStorage.get("mp4video");
    }

    apply() {
        for (let node of document.querySelectorAll("[data-webm-source]")) {
            let mp4 = node.dataset.mp4Source;
            let mp4hd = node.dataset.mp4HdSource;
            if (!mp4 || !mp4hd) { continue; }

            node.dataset.webmSource = mp4;
            node.dataset.webmHdSource = mp4hd;

            let video = node.querySelector("video");
            if (!video) { continue; }

            video.dataset.sdSrc = mp4;
            video.dataset.hdSrc = mp4hd;
            this.context.toggleVideoDefinition(video, false);
        }
    }
}
