import {LocalStorage, TimeUtils} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FHDPlayer extends Feature {

    checkPrerequisites() {
        return document.querySelector("div.highlight_movie") !== null;
    }

    apply() {

        for (const container of document.querySelectorAll("div.highlight_movie")) {

            // Check if the video has already loaded
            if (container.children[0] instanceof HTMLVideoElement) {
                this._addHDControl(container);
                this._addMouseMoveHandler(container);
                continue;
            }

            // Apply features to each video as it's added to the DOM
            new MutationObserver((_, observer) => {
                // The video may fail to load, but just disconnect for now
                observer.disconnect();

                if (container.children[0] instanceof HTMLVideoElement) {
                    this._addHDControl(container);
                    this._addMouseMoveHandler(container);
                }
            }).observe(container, {"childList": true});
        }
    }

    _clickHDControl() {
        const playInHD = LocalStorage.get("playback_hd");

        // When the "HD" button is clicked change the definition for all videos accordingly
        for (const node of document.querySelectorAll("video.highlight_movie")) {
            this.context.toggleVideoDefinition(node, !playInHD);
        }

        LocalStorage.set("playback_hd", !playInHD);
    }

    _addHDControl(container) {
        const video = container.children[0];

        const btn = document.createElement("div");
        btn.classList.add("es_hd_toggle");
        btn.textContent = "HD";
        btn.addEventListener("click", () => { this._clickHDControl(); });
        container.querySelector(".time").after(btn);

        // Toggle fullscreen on double click
        video.addEventListener("dblclick", () => {
            container.querySelector(".fullscreen_button").click();
        });

        this.context.toggleVideoDefinition(video, LocalStorage.get("playback_hd"));
    }

    _addMouseMoveHandler(container) {
        const [video, overlay, titlebar = null] = container.children;
        let timer;

        video.addEventListener("mousemove", () => {
            if (timer) {
                timer.reset();
                video.style.cursor = "";
                overlay.style.bottom = "0px";
                if (titlebar) {
                    titlebar.style.top = "0px";
                }
            } else {
                timer = TimeUtils.resettableTimer(() => {
                    video.style.cursor = "none";
                    overlay.style.bottom = "-35px";
                    if (titlebar) {
                        titlebar.style.top = "-35px";
                    }
                }, 2000);
            }
        });

        video.addEventListener("mouseleave", () => {
            // Avoid hiding the overlay when moving the cursor from video to overlay
            timer?.stop();
        });
    }
}
