import {HTML, Localization} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";

export default class FPlayers extends Feature {

    async checkPrerequisites() {
        if (this.context.isDlcLike || this.context.isVideoOrHardware) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.players) {
            return false;
        }

        this._data = result.players;
        return true;
    }

    apply() {

        HTML.afterBegin(".rightcol.game_meta_data",
            `<div class="block responsive_apppage_details_right heading">${Localization.str.charts.current}</div>
            <div class="block responsive_apppage_details_right as_players">
                <div class="block_content_inner">
                    <div class="as_players_stat">${Localization.str.charts.playing_now}:<span class="as_players_num">${Number(this._data.recent)}</span></div>
                    <div class="as_players_stat">${Localization.str.charts.peaktoday}:<span class="as_players_num">${Number(this._data.peak_today)}</span></div>
                    <div class="as_players_stat">${Localization.str.charts.peakall}:<span class="as_players_num">${Number(this._data.peak_all)}</span></div>
                </div>
            </div>`);
    }
}
