<script lang="ts">
    import {slide} from "svelte/transition";
    import SmallSteamButton from "../../../Steam/SmallSteamButton.svelte";
    import ToggleIcon from "../../../Steam/ToggleIcon.svelte";
    import {
        __coll_inCollection,
        __coll_neverPlayed,
        __coll_played,
        __coll_totalTime,
        __hide,
        __hoursShort,
        __show,
        __wl_label,
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        countTotal: string;
        countPlayed: string;
        countNeverPlayed: string;
        totalTime: string;
    }

    let {
        countTotal,
        countPlayed,
        countNeverPlayed,
        totalTime
    }: Props = $props();

    let isOpen: boolean = $state(false);
</script>


<ul>
    <li>
        <div>{L(__coll_totalTime)}</div>
        {L(__hoursShort, {"hours": totalTime})}
    </li>

    <li>
        <div>{L(__coll_inCollection)}</div>
        {countTotal}
    </li>

    <li>
        <div>{L(__coll_played)}</div>
        {countPlayed}
    </li>

    <li>
        <div>{L(__coll_neverPlayed)}</div>
        {countNeverPlayed}
    </li>
</ul>


<style>
    ul {
        margin-bottom: 10px;
        display: flex;
        gap: 50px;
        padding: 12px;
        overflow: hidden;
        justify-content: flex-start;
        align-items: center;
        background: #19212d;
        color: #b8bcbfcc;
        font-size: 12px;
        line-height: 1.2;
    }
    li {
        list-style-type: none;
        margin: 0;
        padding: 0;
    }
    div {
        color: #b8bcbf;
        font-weight: 700;
        text-transform: uppercase;
    }
</style>
