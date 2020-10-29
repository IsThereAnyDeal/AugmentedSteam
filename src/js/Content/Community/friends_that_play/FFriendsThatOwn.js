import {HTML, HTMLParser, Localization, SyncedStorage} from "../../../core_modules";
import {Background, Feature, RequestData} from "../../../Modules/content";
import {Page} from "../../Page";

export default class FFriendsThatOwn extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("showallfriendsthatown");
    }

    async apply() {

        const friendsPromise = RequestData.getHttp("https://steamcommunity.com/my/friends/");
        const result = await Background.action("appuserdetails", this.context.appid);
        if (!result || !result.success || !result.data || !result.data.friendsown || !result.data.friendsown.length) { return; }

        const friendsData = await friendsPromise;
        const friendsHtml = HTMLParser.htmlToDOM(friendsData);

        const friendsOwn = result.data.friendsown;

        let html = `<div class="mainSectionHeader friendListSectionHeader">
                        ${Localization.str.all_friends_own.replace("__friendcount__", friendsOwn.length)}
                        <span class="underScoreColor">_</span>
                    </div>`;

        html += `<div class="profile_friends" style="height: ${48 * friendsOwn.length / 3}px;">`;

        for (const item of friendsOwn) {
            const miniProfile = item.steamid.slice(4) - 1197960265728; // whaat?

            const friendNode = friendsHtml.querySelector(`.friend_block_v2[data-miniprofile='${miniProfile}']`);
            if (!friendNode) { continue; }

            const profileName = friendNode.querySelector(".friend_block_content").firstChild.textContent;

            let status = "";
            if (friendNode.classList.contains("in-game")) {
                status = "in-game";
            } else if (friendNode.classList.contains("online")) {
                status = "online";
            }

            const profileLink = friendNode.querySelector("a.selectable_overlay").href;
            const profileAvatar = friendNode.querySelector(".player_avatar img").src;
            const playtimeTwoWeeks = Localization.str.hours_short.replace(
                "__hours__",
                Math.round(item.playtime_twoweeks / 60 * 10) / 10
            );
            const playtimeTotal = Localization.str.hours_short.replace(
                "__hours__",
                Math.round(item.playtime_total / 60 * 10) / 10
            );
            const statsLink = `${profileLink}/stats/${this.context.appid}/compare`;

            html
                += `<div class="friendBlock persona ${status}" data-miniprofile="${miniProfile}">
                    <a class="friendBlockLinkOverlay" href="${profileLink}"></a>
                    <div class="playerAvatar ${status}">
                        <img src="${profileAvatar}">
                    </div>
                    <div class="friendBlockContent">
                        ${profileName}<br>
                        <span class="friendSmallText">${playtimeTwoWeeks} / ${playtimeTotal}<br>
                            <a class="whiteLink friendBlockInnerLink" href="${statsLink}">View stats</a>
                        </span>
                    </div>
                </div>`;
        }

        html += "</div>";

        HTML.beforeEnd(".friends_that_play_content", html);

        // Reinitialize miniprofiles by injecting the function call.
        // eslint-disable-next-line no-undef, new-cap
        Page.runInPageContext(() => { InitMiniprofileHovers(); });
    }
}
