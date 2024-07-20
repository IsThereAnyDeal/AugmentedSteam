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

    export let countTotal: string;
    export let countPlayed: string;
    export let countNeverPlayed: string;
    export let totalTime: string;

    let isOpen: boolean = false;
</script>


<div class="stats">
    <h3>
        {L(__wl_label)}
        <SmallSteamButton on:click={() => (isOpen = !isOpen)}>
            {L(isOpen ? __hide : __show)}
            <ToggleIcon down={!isOpen} />
        </SmallSteamButton>
    </h3>

    {#if isOpen}
        <div class="stats_content" transition:slide={{axis: "y", duration: 200}}>
            <div class="stat"><span>{L(__hoursShort, {"hours": totalTime})}</span>{L(__coll_totalTime)}</div>
            <div class="stat"><span>{countTotal}</span>{L(__coll_inCollection)}</div>
            <div class="stat"><span>{countPlayed}</span>{L(__coll_played)}</div>
            <div class="stat"><span>{countNeverPlayed}</span>{L(__coll_neverPlayed)}</div>
        </div>
    {/if}
</div>


<style>
    .stats {
        margin: 0 auto 20px auto;
        max-width: 936px;
    }

    h3 {
        color: #ffffff;
        font-size: 22px;
        font-family: "Motiva Sans", Sans-serif;
        font-weight: normal;
        text-transform: uppercase;
        display: flex;
        gap: 5px;
        justify-content: flex-start;
        align-items: baseline;
    }

    .stats_content {
        display: flex;
        padding: 25px;
        overflow: hidden;
        justify-content: space-evenly;
        align-items: center;
        font-size: 1.6em;
        text-align: center;
    }
    .stat {
        display: flex;
        flex-direction: column;
    }
    .stat > span {
        font-size: 1.8em;
        font-weight: 300;
    }
</style>
