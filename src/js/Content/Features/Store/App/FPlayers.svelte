<script lang="ts" context="module">
    // @ts-ignore
    import self_ from "./FPlayers.svelte";
    import Settings from "@Options/Data/Settings";
    import Feature from "@Content/Modules/Context/Feature";
    import type CApp from "@Content/Features/Store/App/CApp";

    export class FPlayers extends Feature<CApp> {
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
</script>

<script lang="ts">
    import {__charts_current, __charts_peakall, __charts_peaktoday, __charts_playingNow} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    export let recent: number
    export let peakToday: number;
    export let peakAll: number;

    let formatter = new Intl.NumberFormat(navigator.language);
</script>


<div class="block responsive_apppage_details_right heading">{L(__charts_current)}</div>
<div class="block responsive_apppage_details_right">
    <div class="block_content_inner as_players">
        <div class="as_stat">
            <span>{L(__charts_playingNow)}</span>
            {formatter.format(recent)}
        </div>
        <div class="as_stat">
            <span>{L(__charts_peaktoday)}</span>
            {formatter.format(peakToday)}
        </div>
        <div class="as_stat">
            <span>{L(__charts_peakall)}</span>
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
