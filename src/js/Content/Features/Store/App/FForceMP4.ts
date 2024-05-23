import type CApp from "@Content/Features/Store/App/CApp";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import LocalStorage from "@Core/Storage/LocalStorage";

export default class FForceMP4 extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return Settings.mp4video;
    }

    override async apply(): Promise<void> {

        const playInHD: boolean = await LocalStorage.get("playback_hd") ?? false;

        for (const node of document.querySelectorAll<HTMLElement>("[data-webm-source]")) {
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
