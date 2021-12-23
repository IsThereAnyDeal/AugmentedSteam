import {GameId, HTML} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";

export default class FAchievementLink extends CallbackFeature {

    setup() {
        this.callback();
    }

    callback(parent = document) {

        for (const node of parent.querySelectorAll(".blotter_daily_rollup_line")) {

            const firstImg = node.querySelector(":scope > img");
            if (!firstImg) { continue; }

            const linksNode = node.querySelector(":scope > span");
            const appid = GameId.getAppid(linksNode && linksNode.querySelector("a:nth-of-type(2)"));
            if (!appid) { continue; }

            let profileUrl = linksNode.querySelector("a[data-miniprofile]").href;
            if (!profileUrl.endsWith("/")) {
                profileUrl += "/";
            }

            const wrapper = HTML.wrap(
                `<a class="es-ach-link" href="${profileUrl}stats/${appid}/achievements/" target="_blank"></a>`,
                firstImg,
                null,
            );

            // Preserve space that existed between images before they were wrapped
            for (const el of wrapper.children) {
                el.insertAdjacentText("afterend", " ");
            }
        }
    }
}
