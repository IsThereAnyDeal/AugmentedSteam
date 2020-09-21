import {Feature} from "modules";
import {SyncedStorage} from "core";

export class FForceMP4 extends Feature {
    checkPrerequisites() {
        return SyncedStorage.get("mp4video");
    }

    apply() {
        for (const node of document.querySelectorAll("[data-webm-source]")) {
            const mp4 = node.dataset.mp4Source;
            const mp4hd = node.dataset.mp4HdSource;
            if (!mp4 || !mp4hd) { continue; }

            node.dataset.webmSource = mp4;
            node.dataset.webmHdSource = mp4hd;

            const video = node.querySelector("video");
            if (!video) { continue; }

            video.dataset.sdSrc = mp4;
            video.dataset.hdSrc = mp4hd;
            this.context.toggleVideoDefinition(video, false);
        }
    }
}
