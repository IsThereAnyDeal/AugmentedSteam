import {Context, ContextType} from "../../../modulesContent";
import FBackgroundPreviewLink from "./FBackgroundPreviewLink";

export class CPointsShop extends Context {

    constructor() {

        super(ContextType.POINTS_SHOP, [
            FBackgroundPreviewLink,
        ]);
    }

    async applyFeatures() {

        const root = document.querySelector("#application_root");
        if (root.childElementCount === 0) {
            await new Promise(resolve => {
                new MutationObserver((mutations, observer) => {
                    observer.disconnect();
                    resolve();
                }).observe(root, {"childList": true});
            });
        }

        super.applyFeatures();
    }
}
