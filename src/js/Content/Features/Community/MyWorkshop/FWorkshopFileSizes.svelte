<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __calcWorkshopSize_calcFinished,
        __calcWorkshopSize_calcSize,
        __calcWorkshopSize_totalSize
    } from "@Strings/_strings";
    import LargeSteamButton from "@Content/Steam/LargeSteamButton.svelte";

    interface TCalcResponse {
        total: number,
        success: number,
        size: string
    }

    interface Props {
        oncalc: () => Promise<TCalcResponse>
    }

    let promise: Promise<TCalcResponse>|null = $state(null);

    let { oncalc }: Props = $props();

    function onclick(): void {
        promise = oncalc();
    }
</script>


<div class="rightSectionHolder">
    <div class="rightDetailsBlock">
        <LargeSteamButton {onclick}>
            {L(__calcWorkshopSize_calcSize)}
        </LargeSteamButton>

        {#if promise}
            {#await promise then data}
                <div class="results">
                    <div>
                        {L(__calcWorkshopSize_calcFinished, {
                            success: data.success,
                            total: data.total
                        })}
                    </div>
                    <div>
                        {L(__calcWorkshopSize_totalSize, {size: data.size})}
                    </div>
                </div>
            {/await}
        {/if}
    </div>
</div>


<style>
    .rightDetailsBlock {
        padding-bottom: 0;
    }

    .results {
        margin-top: 8px;
    }
</style>