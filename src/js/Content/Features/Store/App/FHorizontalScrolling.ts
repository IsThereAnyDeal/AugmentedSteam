import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CApp from "@Content/Features/Store/App/CApp";
import SelectorMap from "@Content/SelectorMap";
import dynamicNode from "@Content/Modules/DynamicNode/DynamicNode";

export default class FHorizontalScrolling extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.horizontalscrolling;
    }

    override async apply(): Promise<void> {
        const parent = document.querySelector<HTMLElement>(".highlight_ctn");
        if (!parent) {
            console.error("Couldn't find highlights");
            return;
        }

        const slider = await dynamicNode({
            selector: () => parent.querySelector<HTMLElement>(SelectorMap.store.app.highlightSlider),
            observable: parent
        });

        let lastScroll = 0;

        slider.addEventListener("wheel", e => {
            e.preventDefault();
            e.stopPropagation();

            if (Date.now() - lastScroll < 200) { return; }
            lastScroll = Date.now();

            const currentNode = slider.querySelector(SelectorMap.store.app.highlightSliderCurrentNode)
            if (currentNode) {
                const isScrollDown = e.deltaY > 0;
                const sibling = isScrollDown
                    ? currentNode.nextElementSibling
                    : currentNode.previousElementSibling

                if (sibling) {
                    (<HTMLElement>sibling).click();
                }
            }
        });
    }
}
