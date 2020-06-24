import {ASFeature} from "../../ASFeature.js";
import {HTML, LocalStorage} from "../../../core.js";

export class FHDPlayer extends ASFeature {

    checkPrerequisites() {
        return document.querySelector("div.highlight_movie");
    }

    apply() {
        const self = this;
        const movieNode = document.querySelector("div.highlight_movie");
        let playInHD = LocalStorage.get("playback_hd");

        // Add HD Control to each video as it's added to the DOM
        const firstVideoIsPlaying = movieNode.querySelector("video.highlight_movie");
        if (firstVideoIsPlaying) {
            addHDControl(firstVideoIsPlaying);
        }

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!node.matches("video.highlight_movie")) { continue; }
                    addHDControl(node);
                }
            }
        });
        for (const node of document.querySelectorAll("div.highlight_movie")) {
            observer.observe(node, {"childList": true});
        }

        // When the "HD" button is clicked change the definition for all videos accordingly
        document.querySelector("#highlight_player_area").addEventListener("click", clickHDControl, true);
        function clickHDControl(ev) {
            if (!ev.target.closest(".es_hd_toggle")) { return; }

            ev.preventDefault();
            ev.stopPropagation();

            const videoControl = ev.target.closest("div.highlight_movie").querySelector("video");
            const playInHD = self.context.toggleVideoDefinition(videoControl);

            for (const node of document.querySelectorAll("video.highlight_movie")) {
                if (node === videoControl) { continue; }
                self.context.toggleVideoDefinition(node, playInHD);
            }

            LocalStorage.set("playback_hd", playInHD);
        }

        // When the slider is expanded first time after the page was loaded set videos definition to HD
        for (const node of document.querySelectorAll(".es_slider_toggle")) {
            node.addEventListener("click", clickInitialHD, false);
        }
        function clickInitialHD(ev) {
            ev.currentTarget.removeEventListener("click", clickInitialHD, false);
            if (!ev.target.classList.contains("es_expanded")) { return; }
            for (const node of document.querySelectorAll("video.highlight_movie.es_video_sd")) {
                self.context.toggleVideoDefinition(node, true);
            }
            LocalStorage.set("playback_hd", true);
        }

        function addHDControl(videoControl) {
            playInHD = LocalStorage.get("playback_hd");

            function _addHDControl() {

                // Add "HD" button to the video
                if (videoControl.dataset.hdSrc) {
                    const node = videoControl.parentNode.querySelector(".time");
                    if (node) {
                        HTML.afterEnd(node, "<div class=\"es_hd_toggle\"><span>HD</span></div>");
                    }
                }

                // Override Valve's auto switch to HD when putting a video in fullscreen
                let node = videoControl.parentNode.querySelector(".fullscreen_button");
                if (node) {
                    let newNode = document.createElement("div");
                    newNode.classList.add("fullscreen_button");
                    newNode.addEventListener("click", (() => toggleFullscreen(videoControl)), false);
                    node.replaceWith(newNode);
                    node = null; // prevent memory leak
                    newNode = null;
                }

                // Toggle fullscreen on video double click
                videoControl.addEventListener("dblclick", (() => toggleFullscreen(videoControl)), false);

                self.context.toggleVideoDefinition(videoControl, playInHD);
            }
            setTimeout(_addHDControl, 150);

            // prevents a bug in Chrome which causes videos to stop playing after changing the src
        }

        function toggleFullscreen(videoControl) {
            const fullscreenAvailable = document.fullscreenEnabled || document.mozFullScreenEnabled;

            // Mozilla unprefixed in v64
            if (!fullscreenAvailable) { return; }

            const container = videoControl.parentNode;
            const isFullscreen = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

            /*
             * Mozilla unprefixed in v64
             * Chrome unprefixed in v53
             */

            if (isFullscreen) {
                if (document.exitFullscreen) { document.exitFullscreen(); } else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); } // Mozilla unprefixed in v64
            } else {
                let response = null;
                if (container.requestFullscreen) { response = container.requestFullscreen(); } else if (container.mozRequestFullScreen) { response = container.mozRequestFullScreen(); } // Mozilla unprefixed in v64
                else if (container.webkitRequestFullscreen) { container.webkitRequestFullscreen(); } // Chrome unprefixed in v69, no promise
                // if response is a promise, catch any errors it throws
                Promise.resolve(response).catch(err => console.error(err));
            }
        }
    }
}
