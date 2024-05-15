import AppId from "@Core/GameId/AppId";
import type CProfileActivity from "@Content/Features/Community/ProfileActivity/CProfileActivity";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import type {ASEvent} from "@Content/Modules/ASEventHandler";

export default class FAchievementLink extends Feature<CProfileActivity> {

    override apply(): void {
        this.callback();
        this.context.onContent.subscribe((e: ASEvent<HTMLElement>) => this.callback(e.data))
    }

    callback(parent: Document|HTMLElement = document) {

        for (const node of parent.querySelectorAll(".blotter_daily_rollup_line")) {

            const firstImg = node.querySelector(":scope > img");
            if (!firstImg) { continue; }

            const linksNode = node.querySelector<HTMLSpanElement>(":scope > span");
            if (!linksNode) { continue; }

            const appid = AppId.fromElement(linksNode && linksNode.querySelector<HTMLAnchorElement>("a:nth-of-type(2)"));
            if (!appid) { continue; }

            let profileUrl = linksNode.querySelector<HTMLAnchorElement>("a[data-miniprofile]")?.href;
            if (!profileUrl || !profileUrl.endsWith("/")) {
                profileUrl += "/";
            }

            const wrapper = HTML.wrap<HTMLAnchorElement>(
                `<a class="es-ach-link" href="${profileUrl}stats/${appid}/achievements/" target="_blank"></a>`,
                firstImg,
                null,
            );

            if (wrapper) {
                // Preserve space that existed between images before they were wrapped
                for (const el of wrapper.children) {
                    el.insertAdjacentText("afterend", " ");
                }
            }
        }
    }
}
