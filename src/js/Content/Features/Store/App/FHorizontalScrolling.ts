import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FHorizontalScrolling extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return Settings.horizontalscrolling;
    }

    apply() {
        const parent = document.querySelector(".highlight_ctn");
        if (!parent) {
            console.error("Couldn't find highlights");
        }

        const slider = this.#getSlider(parent);
        if (slider) {
            this.#setup(slider);
        } else {
            const observer = new MutationObserver(() => {
                const slider = this.#getSlider();
                if (slider) {
                    this.#setup(slider);
                    observer.disconnect();
                }
            });
            observer.observe(parent, {
                subtree: true
            });
        }
    }

    #getSlider(parent: HTMLElement): HTMLElement|undefined {
        return parent.querySelector("._21pEuTVe17EOUzkHK8ZGnJ");
    }

    #setup(slider: HTMLElement): void {
        let lastScroll = 0;

        slider.addEventListener("wheel", e => {
            e.preventDefault();
            e.stopPropagation();

            if (Date.now() - lastScroll < 200) { return; }
            lastScroll = Date.now();

            const currentNode = slider.querySelector(".deMuRscIE7upszCfACmbK._3VIimult0z05qCgQN1CfPg")

            const isScrollDown = e.deltaY > 0;
            if (isScrollDown) {
                currentNode.nextElementSibling?.click();
            } else {
                currentNode.previousElementSibling?.click();
            }
        });
    }
}
