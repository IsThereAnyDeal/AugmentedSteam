import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FHorizontalScrolling extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return Settings.horizontalscrolling;
    }

    apply() {
        const parent = document.querySelector<HTMLElement>(".highlight_ctn");
        if (!parent) {
            console.error("Couldn't find highlights");
            return;
        }

        const slider = this.#getSlider(parent);
        if (slider) {
            this.#setup(slider);
        } else {
            const observer = new MutationObserver(() => {
                const slider = this.#getSlider(parent);
                if (slider) {
                    this.#setup(slider);
                    observer.disconnect();
                }
            });
            observer.observe(parent, {
                childList: true,
                subtree: true
            });
        }
    }

    #getSlider(parent: HTMLElement): HTMLElement|null {
        return parent.querySelector<HTMLElement>(".ZpjLn9D4rTIVnM4axYSoG");
    }

    #setup(slider: HTMLElement): void {
        let lastScroll = 0;

        slider.addEventListener("wheel", e => {
            e.preventDefault();
            e.stopPropagation();

            if (Date.now() - lastScroll < 200) { return; }
            lastScroll = Date.now();

            const currentNode = slider.querySelector("._2Ose8zPg3MlKQQeG9nwv24._2uCL56lGO9iUUcLEtE83zG")
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
