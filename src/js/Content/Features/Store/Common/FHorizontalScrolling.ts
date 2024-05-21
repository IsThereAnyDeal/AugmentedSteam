import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CStoreBase from "@Content/Features/Store/Common/CStoreBase";

export default class FHorizontalScrolling extends Feature<CStoreBase> {

    override checkPrerequisites(): boolean {
        return Settings.horizontalscrolling;
    }

    apply() {

        for (const node of document.querySelectorAll<HTMLElement>(".slider_ctn:not(.spotlight)")) {
            this._initHorizontalScroll(
                node.parentNode!.querySelector<HTMLElement>("#highlight_strip, .store_horizontal_autoslider_ctn")!,
                node.querySelector<HTMLElement>(".slider_left")!,
                node.querySelector<HTMLElement>(".slider_right")!,
            );
        }
    }

    private _initHorizontalScroll(
        parentNode: HTMLElement,
        controlLeftNode: HTMLElement,
        controlRightNode: HTMLElement
    ): void {

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
