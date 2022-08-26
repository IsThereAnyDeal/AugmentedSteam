import {CallbackFeature} from "../../../Modules/Feature/CallbackFeature";
import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";

export default class FSteamSpy extends CallbackFeature {

    async checkPrerequisites() {
        if (this.context.isDlcLike || this.context.isVideoOrHardware) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.steamspy || !result.steamspy.owners) {
            return false;
        }

        this._data = result.steamspy;
        return true;
    }

    setup() {
        this._initialized = false;

        HTML.beforeBegin(
            document.querySelector(".sys_req").parentNode,
            "<div id='steam-spy'></div>"
        );

        if (SyncedStorage.get("show_steamspy_info")) {
            this.callback("steamspy");
        }
    }

    callback(type) {
        if (type !== "steamspy" || this._initialized) { return; }
        this._initialized = true;

        const owners = this._data.owners.split("..");
        const ownersFrom = HTML.escape(owners[0].trim());
        const ownersTo = HTML.escape(owners[1].trim());
        const averageTotal = this._getTimeString(this._data.average_forever);
        const average2weeks = this._getTimeString(this._data.average_2weeks);

        const node = document.getElementById("steam-spy");

        // This class adds a margin, so it'd waste space if it were already added before
        node.classList.add("game_area_description");

        HTML.inner(node,
            `<h2>${Localization.str.spy.player_data}</h2>
            <div class="chart-content">
                <div class="chart-stat"><span class="num">${ownersFrom}<br>-<br>${ownersTo}</span><br>${Localization.str.spy.owners}</div>
                <div class="chart-stat"><span class="num">${averageTotal}</span><br>${Localization.str.spy.average_playtime}</div>
                <div class="chart-stat"><span class="num">${average2weeks}</span><br>${Localization.str.spy.average_playtime_2weeks}</div>
            </div>
            <span class="chart-footer">${Localization.str.powered_by.replace("__link__", `<a href="https://steamspy.com/app/${this.context.appid}" target="_blank">steamspy.com</a>`)}</span>`);
    }

    _getTimeString(value) {

        let _value = value;
        const result = [];

        const days = Math.trunc(_value / 1440);
        if (days > 0) { result.push(`${Localization.str.spy.playtime_unit_day.replace("__days__", days)}`); }
        _value -= days * 1440;

        const hours = Math.trunc(_value / 60);
        result.push(`${Localization.str.spy.playtime_unit_hour.replace("__hours__", hours)}`);
        _value -= hours * 60;

        const minutes = _value;
        result.push(`${Localization.str.spy.playtime_unit_minute.replace("__minutes__", minutes)}`);

        return result.join(" ");
    }
}
