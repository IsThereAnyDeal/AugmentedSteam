import {CallbackFeature} from "../../../Modules/Feature/CallbackFeature";
import {HTML, Localization, SyncedStorage} from "../../../../modulesCore";

export default class FSteamChart extends CallbackFeature {

    async checkPrerequisites() {
        if (this.context.isDlcLike || this.context.isVideoOrHardware) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.charts || !result.charts.chart || !result.charts.chart.peakall) {
            return false;
        }

        this._chart = result.charts.chart;
        return true;
    }

    setup() {
        this._initialized = false;

        HTML.beforeBegin(
            document.querySelector(".sys_req").parentNode,
            "<div id='steam-charts'></div>"
        );

        if (SyncedStorage.get("show_steamchart_info")) {
            this.callback("steamchart");
        }
    }

    callback(type) {
        if (type !== "steamchart" || this._initialized) { return; }
        this._initialized = true;

        const node = document.getElementById("steam-charts");

        // This class adds a margin, so it'd waste space if it were already added before
        node.classList.add("game_area_description");

        HTML.inner(node,
            `<h2>${Localization.str.charts.current}</h2>
            <div class="chart-content">
                <div class="chart-stat"><span class="num">${HTML.escape(this._chart.current)}</span><br>${Localization.str.charts.playing_now}</div>
                <div class="chart-stat"><span class="num">${HTML.escape(this._chart.peaktoday)}</span><br>${Localization.str.charts.peaktoday}</div>
                <div class="chart-stat"><span class="num">${HTML.escape(this._chart.peakall)}</span><br>${Localization.str.charts.peakall}</div>
            </div>
            <span class="chart-footer">${Localization.str.powered_by.replace("__link__", `<a href="https://steamcharts.com/app/${this.context.appid}" target="_blank">SteamCharts.com</a>`)}</span>`);
    }
}
