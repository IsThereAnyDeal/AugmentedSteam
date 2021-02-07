import {HTMLParser} from "../../Core/Html/HtmlParser";
import {Localization} from "../../Core/Localization/Localization";
import {Background} from "./Background";

class Stats {

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

    static async getAchievementBarForGamelist(path, appid) {

        const html = await Background.action("stats", path, appid);
        const dummy = HTMLParser.htmlToDOM(html);
        const achNode = dummy.querySelector("#topSummaryAchievements");

        if (!achNode) { return null; }

        achNode.style.whiteSpace = "nowrap";

        const stats = achNode.innerText.match(/(\d+)\D+(\d+)\D+(\d{1,3})%/);

        // 1 full match, 3 group matches
        if (!stats || stats.length !== 4) {
            return null;
        }

        const achievementStr = Localization.str.achievements.summary
            .replace("__unlocked__", stats[1])
            .replace("__total__", stats[2])
            .replace("__percentage__", stats[3]);

        // https://github.com/SteamDatabase/SteamTracking/blob/master/steamcommunity.com/public/javascript/profile_gameslist_functions.js#L216-L217
        const achBarWidth = 185 * (stats[1] / stats[2]) || 0; // For some reason some games report 0 total achievements, check for NaN
        const achBarWidthRemainder = 185 - achBarWidth;

        return `<div class="recentAchievements">
            ${achievementStr}
            <br>
            <img src="https://community.akamai.steamstatic.com/public/images/skin_1/achieveBarLeft.gif" width="2" height="12" border="0">
            <img src="https://community.akamai.steamstatic.com/public/images/skin_1/achieveBarFull.gif" width="${achBarWidth}" height="12" border="0">
            <img src="https://community.akamai.steamstatic.com/public/images/skin_1/achieveBarEmpty.gif" width="${achBarWidthRemainder}" height="12" border="0">
            <img src="https://community.akamai.steamstatic.com/public/images/skin_1/achieveBarRight.gif" width="2" height="12" border="0">
            <br>
        </div>`.replace(/>\s+</g, "><"); // Remove whitespace between tags to avoid layout issues
    }
}

export {Stats};
