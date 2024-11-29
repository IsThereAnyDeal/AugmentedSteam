import {__twitch_nowStreaming, __twitch_viewers} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Settings from "@Options/Data/Settings";
import HTML from "@Core/Html/Html";
import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";

export default class FTwitchShowcase extends Feature<CProfileHome> {

    override checkPrerequisites(): boolean {
        if (!Settings.profile_showcase_twitch) {
            return false;
        }

        // Don't show our Twitch.tv showcase on our own profile
        return !this.context.user.isSignedIn
            || Settings.profile_showcase_own_twitch
            || window.location.pathname !== this.context.user.profilePath;
    }

    override async apply(): Promise<void> {

        let selector = ".profile_summary a[href*='twitch.tv/']";
        if (!Settings.profile_showcase_twitch_profileonly) {
            selector += ", .customtext_showcase a[href*='twitch.tv/']";
        }
        const search = document.querySelector<HTMLAnchorElement>(selector);
        if (!search) { return; }

        const m = search.href.match(/twitch\.tv\/(.+)/);
        if (!m) { return; }

        const twitchId = m[1]!.replace(/\//g, "");

        const data = await AugmentedSteamApiFacade.fetchTwitchStream(twitchId);
        if (Array.isArray(data)) { return; }

        const channelUsername = data.user_name;
        const channelUrl = search.href;
        const channelGame = data.game;
        const channelViewers = data.view_count;
        const previewUrl = data.thumbnail_url
            .replace("{width}", "636")
            .replace("{height}", "358") + "?" + Math.random();

        HTML.afterBegin(".profile_leftcol",
            `<div class="profile_customization" id="es_twitch">
                <div class="profile_customization_header">
                    ${L(__twitch_nowStreaming, {"username": channelUsername})}
                </div>
                <a class="esi-stream" href="${channelUrl}">
                    <div class="esi-stream__preview">
                        <img src="${previewUrl}">
                        <img src="//store.cloudflare.steamstatic.com/public/shared/images/apphubs/play_icon80.png" class="esi-stream__play">
                        <div class="esi-stream__live">Live on <span class="esi-stream__twitch">Twitch</span></div>
                    </div>
                    <div class="esi-stream__title">
                        <span class="live_stream_app">${channelGame}</span>
                        <span class="live_steam_viewers">${channelViewers} ${L(__twitch_viewers)}</span>
                    </div>
                </a>
            </div>`);
    }
}
