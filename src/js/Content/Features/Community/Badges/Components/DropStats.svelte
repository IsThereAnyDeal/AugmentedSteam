<script lang="ts">
    import {__cardDropsRemaining, __dropCalc, __gamesWithBooster, __gamesWithDrops, __loading} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {onMount} from "svelte";

    export let multipage: boolean;
    export let getDropCounts: () => Promise<[number, number]>;
    export let getBoosterCountEligibility: () => Promise<number>;

    let dropsGames: number;
    let dropsCount: number;
    let boosterCount: number|null;

    let promise: Promise<void>|null = null;

    async function load(): Promise<void> {
        const [games, count] = await getDropCounts();
        dropsGames = games;
        dropsCount = count;

        try {
            boosterCount = await getBoosterCountEligibility();
        } catch {
            boosterCount = null;
        }
    }

    onMount(() => {
        if (!multipage) {
            promise = load();
        }
    })
</script>


<div id="es_calculations">
    {#if promise === null}
        <button type="button" class="btn_grey_black btn_small_thin" on:click={() => promise = load()}>
            <span>{L(__dropCalc)}</span>
        </button>
    {:else}
        {#await promise}
            {L(__loading)}
        {:then _}
            <div>{L(__cardDropsRemaining, {"drops": dropsCount})}</div>
            <div>{L(__gamesWithDrops, {"dropsgames": dropsGames})}</div>

            {#if boosterCount !== null}
                <div>{L(__gamesWithBooster, {"boostergames": boosterCount})}</div>
            {/if}
        {/await}
    {/if}
</div>
