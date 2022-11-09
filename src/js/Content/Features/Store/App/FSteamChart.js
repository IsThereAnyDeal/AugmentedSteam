import CustomizerFeature from "./CustomizerFeature";
import {HTML, Localization} from "../../../../modulesCore";

export default class FSteamChart extends CustomizerFeature {

    constructor(context) {
        super(context, "steam-charts", "show_steamchart_info", "steamchart");
    }

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

    getContent() {
        return `<h2>${Localization.str.charts.current}</h2>
            <div class="chart-content">
                <div class="chart-stat"><span class="num">${HTML.escape(this._chart.current)}</span><br>${Localization.str.charts.playing_now}</div>
                <div class="chart-stat"><span class="num">${HTML.escape(this._chart.peaktoday)}</span><br>${Localization.str.charts.peaktoday}</div>
                <div class="chart-stat"><span class="num">${HTML.escape(this._chart.peakall)}</span><br>${Localization.str.charts.peakall}</div>
            </div>
            <span class="chart-footer">${Localization.str.powered_by.replace("__link__", `<a href="https://steamcharts.com/app/${this.context.appid}" target="_blank">SteamCharts.com</a>`)}</span>`;
    }
}
