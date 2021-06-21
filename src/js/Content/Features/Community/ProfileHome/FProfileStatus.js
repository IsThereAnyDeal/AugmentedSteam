import {Localization} from "../../../../modulesCore";
import {Feature, RequestData, SteamId} from "../../../modulesContent";

export default class FProfileStatus extends Feature {

    checkPrerequisites() {
        this.statusNode = document.querySelector(".profile_in_game_header");
        return this.statusNode !== null;
    }

    async apply() {
        this.steamId = SteamId.getSteamId();
        try {
            const response = await RequestData.getJson(`https://steamcommunity.com/actions/ajaxresolveusers?steamids=${this.steamId}`);
            const player = response.find(p => p.steamid === this.steamId);
            if (!player) {
                throw new Error("Failed to fetch player summary");
            }
            this.summary = player;
        } catch (err) {
            console.error(err);
            return;
        }

        if (this.statusNode.parentNode.classList.contains("es_profile_status")) { // in case of streaming
            return;
        }

        this.statusNode.parentNode.classList.add("es_profile_status");
        switch (this.summary.persona_state) {
            case 0: // Offline
                break;
            case 1: // Online
                break;
            case 2: // Busy
                this.statusNode.parentNode.style.color = "#ed4245";
                this.statusNode.innerText = Localization.str.profile_status.busy;
                break;
            case 3: // Away
                this.statusNode.parentNode.style.color = "#faa81b";
                this.statusNode.innerText = Localization.str.profile_status.away;
                break;
            case 4: // Snooze
                this.statusNode.parentNode.style.color = "#ffffff";
                this.statusNode.innerText = Localization.str.profile_status.snooze;
                break;
            case 5: // Looking to trade
                this.statusNode.parentNode.style.color = "#648a3d";
                this.statusNode.innerText = Localization.str.profile_status.looking_to_trade;
                break;
            case 6: // Looking to play
                this.statusNode.parentNode.style.color = "#ffff69";
                this.statusNode.innerText = Localization.str.profile_status.looking_to_play;
                break;
            default:
                break;
        }
    }
}
