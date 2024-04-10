<script lang="ts" context="module">
    // @ts-ignore
    import self_ from "./FPlayers.svelte";
    import {SyncedStorage} from "../../../../modulesCore";
    import {Feature} from "../../../modulesContent";
    import type {CApp} from "./CApp";

    export class FPlayers extends Feature<CApp> {
        private _data: any;

        override async checkPrerequisites(): Promise<boolean> {
            if (this.context.isDlcLike
                || this.context.isVideoOrHardware
                || !SyncedStorage.get("show_players_info")) {
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
                anchor: target.firstElementChild,
                props: {
                    recent: Number(this._data.recent),
                    peakToday: Number(this._data.peak_today),
                    peakAll: Number(this._data.peak_all)
                }
            }));
        }
    }
</script>

<script lang="ts">
    import {Localization} from "../../../../modulesCore";

    export let recent: number
    export let peakToday: number;
    export let peakAll: number;

    let formatter = new Intl.NumberFormat(navigator.language);
</script>


<div class="block responsive_apppage_details_right heading">{Localization.str.charts.current}</div>
<div class="block responsive_apppage_details_right">
    <div class="block_content_inner as_players">
        <div class="as_stat">
            <span>{Localization.str.charts.playing_now}</span>
            {formatter.format(recent)}
        </div>
        <div class="as_stat">
            <span>{Localization.str.charts.peaktoday}</span>
            {formatter.format(peakToday)}
        </div>
        <div class="as_stat">
            <span>{Localization.str.charts.peakall}</span>
            {formatter.format(peakAll)}
        </div>
    </div>
</div>


<style>
    .as_players {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
    }
    .as_stat {
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        color: #67c1f5;
        font-size: 15px;
    }

    span {
        font-family: Arial, Helvetica, sans-serif;
        color: #556772;
        font-weight: normal;
        text-transform: uppercase;
        font-size: 10px;
    }
</style>
