<script lang="ts">
    import {__cardDropsRemaining, __dropCalc, __gamesWithBooster, __gamesWithDrops, __loading} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {onMount} from "svelte";
    import SmallSteamButton from "@Content/Steam/SmallSteamButton.svelte";

    interface Props {
        multipage: boolean;
        getDropCounts: () => Promise<[number, number]>;
        getBoosterCountEligibility: () => Promise<number>;
    }

    let { multipage, getDropCounts, getBoosterCountEligibility }: Props = $props();

    let dropsGames: number = $state(0);
    let dropsCount: number = $state(0);
    let boosterCount: number|null = $state(null);

    let promise: Promise<void>|null = $state(null);

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
    });
</script>


<div class="parent">
    {#if promise === null}
        <SmallSteamButton onclick={() => promise = load()}>
            {L(__dropCalc)}
        </SmallSteamButton>
    {:else}
        {#await promise}
            {L(__loading)}
        {:then _}
            <div>{@html L(__cardDropsRemaining, {"drops": `<span class="as-cnt">${dropsCount}</span>`})}</div>
            <div>{@html L(__gamesWithDrops, {"dropsgames": `<span class="as-cnt">${dropsGames}</span>`})}</div>

            {#if boosterCount !== null}
                <div>{@html L(__gamesWithBooster, {"boostergames": `<span class="as-cnt">${boosterCount}</span>`})}</div>
            {/if}
        {/await}
    {/if}
</div>


<style>
    .parent {
        margin-top: 15px;
        padding-left: 20px;
    }

    .parent :global(.as-cnt) {
        color: #e1e1e1;
        font-size: 17px;
    }
</style>