<script lang="ts">
    import {__charts_current, __charts_peakall, __charts_peaktoday, __charts_playingNow} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import SidebarBox from "@Content/Features/Store/App/Components/SidebarBox.svelte";

    interface Props {
        recent: number;
        peakToday: number;
        peakAll: number;
    }

    let { recent, peakToday, peakAll }: Props = $props();

    const formatter = new Intl.NumberFormat(document.documentElement.lang || navigator.language);
</script>


<SidebarBox title={L(__charts_current)}>
    <ul>
        <li>
            <span>{L(__charts_playingNow)}</span>
            {formatter.format(recent)}
        </li>
        <li>
            <span>{L(__charts_peaktoday)}</span>
            {formatter.format(peakToday)}
        </li>
        <li>
            <span>{L(__charts_peakall)}</span>
            {formatter.format(peakAll)}
        </li>
    </ul>
</SidebarBox>


<style>
    ul {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        justify-content: center;
        gap: 10px;
    }
    li {
        list-style-type: none;
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        color: #67c1f5;
        font-size: 22px;
    }

    span {
        color: var(--summary-title-text-color, #798a95);
        text-transform: uppercase;
        font-size: 11px;
    }
</style>
