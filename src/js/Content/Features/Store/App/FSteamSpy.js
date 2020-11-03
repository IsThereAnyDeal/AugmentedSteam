import {Feature} from "../../../Modules/Feature/Feature";
import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";

export default class FSteamSpy extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("show_steamspy_info")
            || this.context.isDlc()
            || !document.querySelector(".sys_req")) {
            return false;
        }

        const result = await this.context.data;
        if (result && result.steamspy && result.steamspy.owners) {
            this._data = result.steamspy;
        }

        return typeof this._data !== "undefined";
    }

    apply() {

        const owners = this._data.owners.split("..");
        const ownersFrom = HTML.escape(owners[0].trim());
        const ownersTo = HTML.escape(owners[1].trim());
        const averageTotal = this._getTimeString(this._data.average_forever);
        const average2weeks = this._getTimeString(this._data.average_2weeks);

        HTML.beforeBegin(document.querySelector(".sys_req").parentNode,
            `<div id="steam-spy" class="game_area_description">
                <h2>${Localization.str.spy.player_data}</h2>
                <div class="chart-content">
                    <div class="chart-stat"><span class="num">${ownersFrom}<br>-<br>${ownersTo}</span><br>${Localization.str.spy.owners}</div>
                    <div class="chart-stat"><span class="num">${averageTotal}</span><br>${Localization.str.spy.average_playtime}</div>
                    <div class="chart-stat"><span class="num">${average2weeks}</span><br>${Localization.str.spy.average_playtime_2weeks}</div>
                </div>
                <span class="chart-footer">${Localization.str.powered_by.replace("__link__", `<a href="https://steamspy.com/app/${this.context.appid}" target="_blank">steamspy.com</a>`)}</span>
            </div>`);
    }

    _getTimeString(value) {

        const days = Math.trunc(value / 1440);
        let _value = value;
        _value -= days * 1440;

        const hours = Math.trunc(_value / 60);
        _value -= hours * 60;

        const minutes = _value;

        let result = "";
        if (days > 0) { result += `${days}d `; }
        result += `${hours}h ${minutes}m`;

        return result;
    }
}
