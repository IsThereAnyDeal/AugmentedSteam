<script lang="ts">
    import {__charts_current, __charts_peakall, __charts_peaktoday, __charts_playingNow} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    export let recent: number
    export let peakToday: number;
    export let peakAll: number;

    const formatter = new Intl.NumberFormat(document.documentElement.lang || navigator.language);
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
