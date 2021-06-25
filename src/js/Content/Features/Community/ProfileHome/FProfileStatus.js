import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";
import {Feature, RequestData, SteamId, User} from "../../../modulesContent";

export default class FProfileStatus extends Feature {

    checkPrerequisites() {
        return !this.context.isPrivateProfile;
    }

    async apply() {
        const statusNode = document.querySelector(".profile_in_game_header");
        if (!statusNode) { return; }

        const ingameNode = document.querySelector(".profile_in_game_name");
        const profileSteamId = SteamId.getSteamId();
        let lenderSteamId = null;

        // The input needed to get appid only appears when logged in
        const appidNode = document.querySelector("input[name=ingameAppID]");
        const bInGame = ingameNode && appidNode;
        if (bInGame) {
            const appid = appidNode.value;

            if (SyncedStorage.get("profile_shared_game")) {
                const userToken = await User.getUserToken();
                const {response} = await RequestData.getJson(`https://api.steampowered.com/IPlayerService/IsPlayingSharedGame/v1/?access_token=${userToken}&steamid=${profileSteamId}&appid_playing=${appid}`, {"credentials": "omit"}).catch(() => false);
                lenderSteamId = (response || {}).lender_steamid; // falsy if request failed
            }
        }

        let profile = null;
        let lender = null;
        const steamids = [];
        // if in-game or option profile_accurate_status is disabled, we don't want to request accurate status
        if (!bInGame && SyncedStorage.get("profile_accurate_status")) {
            steamids.push(profileSteamId);
        }
        // lenderSteamId is falsy when profile_shared_game option is disabled
        if (lenderSteamId && lenderSteamId !== "0") {
            steamids.push(lenderSteamId);
        }
        if (steamids.length > 0) {
            try {
                const users = await RequestData.getJson(`https://steamcommunity.com/actions/ajaxresolveusers?steamids=${steamids.join(",")}`);
                for (const user of users) {
                    if (user.steamid === profileSteamId) {
                        profile = user;
                    }
                    if (user.steamid === lenderSteamId) {
                        lender = user;
                    }
                }
            } catch (err) {
                console.error(err);
                return;
            }
        }

        if (statusNode.parentNode.classList.contains("es_profile_status")) { // in case of streaming
            return;
        }

        statusNode.parentNode.classList.add("es_profile_status");
        if (lender) {
            HTML.beforeEnd(ingameNode,
                `<div class="profile_in_game_header">${Localization.str.profile_status.shared_by}</div>
                <div class="profile_in_game_name es_shared_by">
                    <a href="//steamcommunity.com/profiles/${lender.steamid}" data-miniprofile="${lender.accountid}">${lender.persona_name}</a>
                </div>`);
        } else if (profile) {
            this._applyNewStatus(profile, statusNode);
        }
    }

    _applyNewStatus(profile, statusNode) {
        switch (profile.persona_state) {
            case 0: // Offline
                break;
            case 1: // Online
                break;
            case 2: // Busy
                statusNode.parentNode.style.color = "#ed4245";
                statusNode.textContent = Localization.str.profile_status.busy;
                break;
            case 3: // Away
                statusNode.parentNode.style.color = "#faa81b";
                statusNode.textContent = Localization.str.profile_status.away;
                break;
            case 4: // Snooze
                statusNode.parentNode.style.color = "#ffffff";
                statusNode.textContent = Localization.str.profile_status.snooze;
                break;
            case 5: // Looking to trade
                statusNode.parentNode.style.color = "#648a3d";
                statusNode.textContent = Localization.str.profile_status.looking_to_trade;
                break;
            case 6: // Looking to play
                statusNode.parentNode.style.color = "#ffff69";
                statusNode.textContent = Localization.str.profile_status.looking_to_play;
                break;
            default:
                break;
        }
    }
}
