import {LocalStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FHDPlayer extends Feature {

    checkPrerequisites() {
        return document.querySelector("div.highlight_movie") !== null;
    }

    apply() {

        const context = this.context;

        function clickHDControl() {
            const playInHD = LocalStorage.get("playback_hd");

            // When the "HD" button is clicked change the definition for all videos accordingly
            for (const node of document.querySelectorAll("video.highlight_movie")) {
                context.toggleVideoDefinition(node, !playInHD);
            }

            LocalStorage.set("playback_hd", !playInHD);
        }

        function addHDControl(videoEl) {
            const container = videoEl.parentNode;

            const btn = document.createElement("div");
            btn.classList.add("es_hd_toggle");
            btn.textContent = "HD";
            btn.addEventListener("click", clickHDControl);
            container.querySelector(".time").insertAdjacentElement("afterend", btn);

            // Toggle fullscreen on video double click
            videoEl.addEventListener("dblclick", () => {
                container.querySelector(".fullscreen_button").click();
            });

            context.toggleVideoDefinition(videoEl, LocalStorage.get("playback_hd"));
        }

        // Add HD Control to each video as it's added to the DOM
        for (const container of document.querySelectorAll("div.highlight_movie")) {

            // Check if video has already loaded
            const videoEl = container.querySelector("video");
            if (videoEl !== null) {
                addHDControl(videoEl);
                continue;
            }

            new MutationObserver((mutations, observer) => {

                // Steam empties the container if the video or poster failed to load, but that should rarely happen so disconnect immediately
                observer.disconnect();

                for (const {addedNodes} of mutations) {
                    for (const node of addedNodes) {
                        if (node instanceof HTMLVideoElement) {
                            addHDControl(node);
                            break;
                        }
                    }
                }
            }).observe(container, {"childList": true});
        }
    }
}
