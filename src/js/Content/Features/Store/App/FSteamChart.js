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
        if (!result || !result.players) {
            return false;
        }

        this._chart = result.players;
        return true;
    }

    getContent() {
        return `<h2>${Localization.str.charts.current}</h2>
            <div class="chart-content">
                <div class="chart-stat"><span class="num">${Number(this._chart.recent)}</span><br>${Localization.str.charts.playing_now}</div>
                <div class="chart-stat"><span class="num">${Number(this._chart.peak_today)}</span><br>${Localization.str.charts.peaktoday}</div>
                <div class="chart-stat"><span class="num">${Number(this._chart.peak_all)}</span><br>${Localization.str.charts.peakall}</div>
            </div>`;
    }
}
