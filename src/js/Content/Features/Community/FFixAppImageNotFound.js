import {GameId} from "../../../modulesCore";
import {Feature} from "../../modulesContent";

export default class FFixAppImageNotFound extends Feature {

    apply() {

        function fixSrc(node) {

            const appid = GameId.getAppid(node.parentNode.href);
            if (!appid) { return; }

            const src = `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_184x69.jpg`;

            const testImg = document.createElement("img");
            testImg.src = src;
            testImg.addEventListener("load", () => {
                node.src = src;
            });
        }

        document.querySelectorAll("img[src$='338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif']")
            .forEach(node => fixSrc(node));

        const container = document.querySelector("#games_list_rows");
        if (!container) { return; }

        new MutationObserver(mutations => {
            for (const {target} of mutations) {
                if (target.src.endsWith("338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif")) {
                    fixSrc(target);
                }
            }
        }).observe(container, {"subtree": true, "attributeFilter": ["src"]});
    }
}
