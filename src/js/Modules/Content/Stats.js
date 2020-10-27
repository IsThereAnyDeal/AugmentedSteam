import {HTMLParser} from "../Core/Html/HtmlParser";
import {Localization} from "../Core/Localization/Localization";
import {Background} from "../../Content/common";

export class Stats {

    static async getAchievementBar(path, appid) {

        const html = await Background.action("stats", path, appid);
        const dummy = HTMLParser.htmlToDOM(html);
        const achNode = dummy.querySelector("#topSummaryAchievements");

        if (!achNode) { return null; }

        achNode.style.whiteSpace = "nowrap";

        if (!achNode.querySelector("img")) {

            // The size of the achievement bars for games without leaderboards/other stats is fine, return
            return achNode.innerHTML;
        }

        const stats = achNode.innerHTML.match(/(\d+) of (\d+) \((\d{1,3})%\)/);

        // 1 full match, 3 group matches
        if (!stats || stats.length !== 4) {
            return null;
        }

        const achievementStr = Localization.str.achievements.summary
            .replace("__unlocked__", stats[1])
            .replace("__total__", stats[2])
            .replace("__percentage__", stats[3]);

        return `<div>${achievementStr}</div>
                <div class="achieveBar">
                    <div style="width: ${stats[3]}%;" class="achieveBarProgress"></div>
                </div>`;
    }
}
