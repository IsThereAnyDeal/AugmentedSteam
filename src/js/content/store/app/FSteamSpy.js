import { ASFeature } from "../../ASFeature.js";
import { HTML, SyncedStorage } from "../../../core.js";
import { Localization } from "../../../language.js";

export class FSteamSpy extends ASFeature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("show_steamspy_info") || this.context.isDlc() || !document.querySelector(".sys_req")) { return false; }

        let result = await this.context.data;
        if (result && result.steamspy && result.steamspy.owners) {
            this._data = result.steamspy;
        }

        return typeof this._data !== "undefined";
    }

    apply() {

        let owners = this._data.owners.split("..");
        let owners_from = HTML.escape(owners[0].trim());
        let owners_to = HTML.escape(owners[1].trim());
        let averageTotal = this._getTimeString(this._data.average_forever);
        let average2weeks = this._getTimeString(this._data.average_2weeks);

        HTML.beforeBegin(document.querySelector(".sys_req").parentNode,
            `<div id="steam-spy" class="game_area_description">
                <h2>${Localization.str.spy.player_data}</h2>
                <div class="chart-content">
                    <div class="chart-stat"><span class="num">${owners_from}<br>-<br>${owners_to}</span><br>${Localization.str.spy.owners}</div>
                    <div class="chart-stat"><span class="num">${averageTotal}</span><br>${Localization.str.spy.average_playtime}</div>
                    <div class="chart-stat"><span class="num">${average2weeks}</span><br>${Localization.str.spy.average_playtime_2weeks}</div>
                </div>
                <span class="chart-footer">${Localization.str.powered_by.replace("__link__", `<a href="https://steamspy.com/app/${this.context.appid}" target="_blank">steamspy.com</a>`)}</span>
            </div>`);
    }

    _getTimeString(value) {

        let days = Math.trunc(value / 1440);
        value -= days * 1440;

        let hours = Math.trunc(value / 60);
        value -= hours * 60;

        let minutes = value;

        let result = "";
        if (days > 0) { result += `${days}d `; }
        result += `${hours}h ${minutes}m`;

        return result;
    }
}
