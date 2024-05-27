import self_ from "./FPlayers.svelte";
import Settings from "@Options/Data/Settings";
import Feature from "@Content/Modules/Context/Feature";
import type CApp from "@Content/Features/Store/App/CApp";

export default class FPlayers extends Feature<CApp> {
    private _data: any;

    override async checkPrerequisites(): Promise<boolean> {
        if (this.context.isDlcLike
            || this.context.isVideoOrHardware
            || !Settings.show_players_info) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.players) {
            return false;
        }

        this._data = result.players;
        return true;
    }

    override apply(): void {
        let target = document.querySelector(".rightcol.game_meta_data");
        if (!target) {
            throw new Error("Node not found");
        }

        (new self_({
            target,
            anchor: target.firstElementChild ?? undefined,
            props: {
                recent: Number(this._data.recent),
                peakToday: Number(this._data.peak_today),
                peakAll: Number(this._data.peak_all)
            }
        }));
    }
}
