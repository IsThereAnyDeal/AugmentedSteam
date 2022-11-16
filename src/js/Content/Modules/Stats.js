import {HTML} from "../../Core/Html/Html";
import {Localization} from "../../Core/Localization/Localization";
import {Background} from "./Background";

class Stats {

    static async getAchievementBar(path, appid, altStyle = false) {

        const html = await Background.action("stats", path, appid);
        const achNode = HTML.toDom(html).querySelector("#topSummaryAchievements");
        if (!achNode) { return null; }

        // Games without leaderboards will have "grey" style achievement bars, return them
        if (!altStyle && !achNode.querySelector("img")) {
            return achNode.innerHTML;
        }

        // Placement of % sign varies, but percentage always comes last, so match numbers only
        const stats = achNode.textContent.trim().match(/\d+/g);
        if (!stats || stats.length !== 3) { return null; }

        let [unlocked, total, percentage] = stats.map(Number);

        // Total comes before unlocked in some locales
        if (unlocked > total) {
            [unlocked, total] = [total, unlocked];
        }

        // Some games report 0 total achievements for whatever reason
        if (total === 0) { return null; }

        const achievementStr = Localization.str.achievements.summary
            .replace("__unlocked__", unlocked)
            .replace("__total__", total)
            .replace("__percentage__", percentage);

        // Build "blue" style achievement bars even for games with leaderboards because the text display for these are broken
        if (altStyle) {

            // https://github.com/SteamDatabase/SteamTracking/blob/e28569b5b42106480144818c8b41cb729d61e22e/steamcommunity.com/public/javascript/profile_gameslist_functions.js#L239-L240
            const achBarWidth = 185 * (unlocked / total);
            const achBarWidthRemainder = 185 - achBarWidth;

            return `<div class="recentAchievements">
                ${achievementStr}
                <br>
                <img src="https://community.cloudflare.steamstatic.com/public/images/skin_1/achieveBarLeft.gif" width="2" height="12" border="0">
                <img src="https://community.cloudflare.steamstatic.com/public/images/skin_1/achieveBarFull.gif" width="${achBarWidth}" height="12" border="0">
                <img src="https://community.cloudflare.steamstatic.com/public/images/skin_1/achieveBarEmpty.gif" width="${achBarWidthRemainder}" height="12" border="0">
                <img src="https://community.cloudflare.steamstatic.com/public/images/skin_1/achieveBarRight.gif" width="2" height="12" border="0">
                <br>
            </div>`.replace(/>\s+</g, "><"); // Remove whitespace between tags to avoid layout issues
        }

        return `<div>${achievementStr}</div>
            <div class="achieveBar">
                <div style="width: ${percentage}%;" class="achieveBarProgress"></div>
            </div>`;
    }
}

export {Stats};
