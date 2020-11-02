import {Feature} from "../../../Modules/Content/Feature/Feature";
import {HTML, Localization, SyncedStorage} from "../../../core_modules";

export default class FSteamChart extends Feature {

    async checkPrerequisites() {
        if (!SyncedStorage.get("show_steamchart_info")
            || this.context.isDlc()
            || !document.querySelector(".sys_req")) { return false; }

        const result = await this.context.data;
        if (result && result.charts && result.charts.chart && result.charts.chart.peakall) {
            this._chart = result.charts.chart;
        }

        return typeof this._chart !== "undefined";
    }

    apply() {
        HTML.beforeBegin(document.querySelector(".sys_req").parentNode,
            `<div id="steam-charts" class="game_area_description">
                <h2>${Localization.str.charts.current}</h2>
                <div class="chart-content">
                    <div class="chart-stat"><span class="num">${HTML.escape(this._chart.current)}</span><br>${Localization.str.charts.playing_now}</div>
                    <div class="chart-stat"><span class="num">${HTML.escape(this._chart.peaktoday)}</span><br>${Localization.str.charts.peaktoday}</div>
                    <div class="chart-stat"><span class="num">${HTML.escape(this._chart.peakall)}</span><br>${Localization.str.charts.peakall}</div>
                </div>
                <span class="chart-footer">${Localization.str.powered_by.replace("__link__", `<a href="https://steamcharts.com/app/${this.context.appid}" target="_blank">SteamCharts.com</a>`)}</span>
            </div>`);
    }
}
