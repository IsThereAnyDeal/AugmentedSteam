import {SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FHorizontalScrolling extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("horizontalscrolling");
    }

    apply() {

        for (const node of document.querySelectorAll(".slider_ctn:not(.spotlight)")) {
            this._initHorizontalScroll(
                node.parentNode.querySelector("#highlight_strip, .store_horizontal_autoslider_ctn"),
                node.querySelector(".slider_left"),
                node.querySelector(".slider_right"),
            );
        }
    }

    _initHorizontalScroll(parentNode, controlLeftNode, controlRightNode) {

        let lastScroll = 0;

        parentNode.addEventListener("wheel", e => {
            e.preventDefault();
            e.stopPropagation();

            if (Date.now() - lastScroll < 200) { return; }
            lastScroll = Date.now();

            const isScrollDown = e.deltaY > 0;
            if (isScrollDown) {
                controlRightNode.click();
            } else {
                controlLeftNode.click();
            }
        });
    }
}
