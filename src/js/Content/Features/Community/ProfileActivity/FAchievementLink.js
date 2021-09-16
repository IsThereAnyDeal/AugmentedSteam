import {GameId, HTML} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";

export default class FAchievementLink extends CallbackFeature {

    setup() {
        this.callback();
    }

    callback(parent = document) {

        const nodes = Array.from(parent.querySelectorAll(".blotter_daily_rollup_line"))
            .filter(node => node.querySelector(":scope > img") !== null);

        for (const node of nodes) {

            const linksNode = node.querySelector(":scope > span");
            const appid = GameId.getAppid(linksNode && linksNode.querySelector("a:nth-of-type(2)"));
            if (!appid) { continue; }

            let profileUrl = linksNode.querySelector("a[data-miniprofile]").href;
            if (!profileUrl.endsWith("/")) {
                profileUrl += "/";
            }

            HTML.wrap(
                `<a class="es-ach-link" href="${profileUrl}stats/${appid}/achievements/" target="_blank"></a>`,
                node.querySelector(":scope > img"),
                null,
            );
        }
    }
}
