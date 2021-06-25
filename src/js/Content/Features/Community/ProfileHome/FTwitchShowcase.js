import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Background, Feature, User} from "../../../modulesContent";

export default class FTwitchShowcase extends Feature {

    checkPrerequisites() {
        if (!SyncedStorage.get("profile_showcase_twitch")) { return false; }

        // Don't show our Twitch.tv showcase on our own profile
        return !User.isSignedIn
            || SyncedStorage.get("profile_showcase_own_twitch")
            || window.location.pathname !== User.profilePath;
    }

    async apply() {

        let selector = ".profile_summary a[href*='twitch.tv/']";
        if (!SyncedStorage.get("profile_showcase_twitch_profileonly")) {
            selector += ", .customtext_showcase a[href*='twitch.tv/']";
        }
        const search = document.querySelector(selector);
        if (!search) { return; }

        const m = search.href.match(/twitch\.tv\/(.+)/);
        if (!m) { return; }

        const twitchId = m[1].replace(/\//g, "");

        const data = await Background.action("twitch.stream", {"channel": twitchId});

        // If the channel is not streaming, the response is: {"result":"success","data":[]}
        if (Array.isArray(data)) { return; }

        const channelUsername = data.user_name;
        const channelUrl = search.href;
        const channelGame = data.game;
        const channelViewers = data.viewer_count;
        const previewUrl = `${data.thumbnail_url.replace("{width}", 663).replace("{height}", 373)}?${Math.random()}`;
        
        // Add profile status
        const statusNode = document.querySelector(".profile_in_game_header");
        statusNode.parentNode.classList.add("es_profile_status");
        statusNode.parentNode.style.color = "#9147ff";
        statusNode.innerText = Localization.str.profile_status.streaming;

        const subStatusNode = document.querySelector(".profile_in_game_name");
        if (subStatusNode) {
            subStatusNode.innerText = channelGame;
        } else {
            HTML.afterEnd(statusNode, `<div class="profile_in_game_name">${channelGame}</div>`);
        }

        // Add showcase
        HTML.afterBegin(".profile_leftcol",
            `<div class='profile_customization' id='es_twitch'>
                <div class='profile_customization_header'>
                    ${Localization.str.twitch.now_streaming.replace("__username__", channelUsername)}
                </div>
                <a class="esi-stream" href="${channelUrl}">
                    <div class="esi-stream__preview">
                        <img src="${previewUrl}">
                        <img src="https://steamstore-a.akamaihd.net/public/shared/images/apphubs/play_icon80.png" class="esi-stream__play">
                        <div class="esi-stream__live">Live on <span class="esi-stream__twitch">Twitch</span></div>
                    </div>
                    <div class="esi-stream__title">
                        <span class="live_stream_app">${channelGame}</span>
                        <span class="live_steam_viewers">${channelViewers} ${Localization.str.twitch.viewers}</span>
                    </div>
                </a>
            </div>`);
    }
}
