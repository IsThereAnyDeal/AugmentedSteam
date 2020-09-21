import {ASFeature} from "modules";

import {HTML, HTMLParser, Localization, SyncedStorage} from "core";
import {Background, ExtensionLayer, RequestData} from "common";

export class FFriendsThatOwn extends ASFeature {

    checkPrerequisites() {
        return SyncedStorage.get("showallfriendsthatown");
    }

    async apply() {

        let friendsPromise = RequestData.getHttp("https://steamcommunity.com/my/friends/");
        let result = await Background.action("appuserdetails", this.context.appid);
        if (!result || !result.success || !result.data || !result.data.friendsown || !result.data.friendsown.length) { return; }

        let friendsData = await friendsPromise;
        let friendsHtml = HTMLParser.htmlToDOM(friendsData);

        let friendsOwn = result.data.friendsown;

        let html = `<div class="mainSectionHeader friendListSectionHeader">
                        ${Localization.str.all_friends_own.replace('__friendcount__', friendsOwn.length)}
                        <span class="underScoreColor">_</span>
                    </div>`;

        html += '<div class="profile_friends" style="height: ' + (48 * friendsOwn.length / 3) + 'px;">';

        for (let item of friendsOwn) {
            let miniProfile = item.steamid.slice(4) - 1197960265728; // whaat?

            let friendNode = friendsHtml.querySelector(".friend_block_v2[data-miniprofile='"+miniProfile+"']");
            if (!friendNode) { continue; }

            let profileName = friendNode.querySelector(".friend_block_content").firstChild.textContent;

            let status = "";
            if (friendNode.classList.contains("in-game")) { status = "in-game"; }
            else if (friendNode.classList.contains("online")) { status = "online"; }

            let profileLink = friendNode.querySelector("a.selectable_overlay").href;
            let profileAvatar = friendNode.querySelector(".player_avatar img").src;
            let playtimeTwoWeeks = Localization.str.hours_short.replace('__hours__', Math.round(item.playtime_twoweeks / 60 * 10) / 10);
            let playtimeTotal = Localization.str.hours_short.replace('__hours__', Math.round(item.playtime_total / 60 * 10) / 10);
            let statsLink = profileLink + '/stats/' + this.context.appid + '/compare';

            html +=
                `<div class="friendBlock persona ${status}" data-miniprofile="${miniProfile}">
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

        html += '</div>';

        HTML.beforeEnd(".friends_that_play_content", html);

        // Reinitialize miniprofiles by injecting the function call.
        ExtensionLayer.runInPageContext(() => { InitMiniprofileHovers(); });
    }
}
