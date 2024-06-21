<script lang="ts">
    import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
    import {onMount} from "svelte";
    import type {TGetStoreListResponse} from "@Background/Modules/IsThereAnyDeal/_types";
    import type {SettingsSchema} from "../../../Data/_types";
    import {__error, __loading, __options_storesAll} from "@Strings/_strings";
    import Toggle from "../Components/Toggle.svelte";
    import {slide} from "svelte/transition";
    import {L} from "@Core/Localization/Localization";
    import type {Writable} from "svelte/store";

    export let settings: Writable<SettingsSchema>;

    let promise: Promise<TGetStoreListResponse>|null = null;
    let excludedStores: SettingsSchema['excluded_stores'] = [];
    let storelistEl: HTMLElement;
    let showallstores: boolean;

    function onToggle() {
        showallstores = $settings.showallstores;
    }

    function onChange() {
        excludedStores = [...storelistEl.querySelectorAll("input:not(:checked)")]
            .map(node => Number(node.id));
        $settings.excluded_stores = excludedStores;
    }

    onMount(() => {
        promise = (async () => {
            try {
                return await ITADApiFacade.getStoreList();
            } catch (e) {
                console.error(e);
                throw e;
            }
        })();

        onToggle();
        excludedStores = $settings.excluded_stores;
    });
</script>


<Toggle bind:value={$settings.showallstores} on:toggle={onToggle}>{L(__options_storesAll)}</Toggle>

{#if !showallstores}
    <div class="box storelist" transition:slide={{axis: "y", duration: 200}} bind:this={storelistEl} on:change={onChange}>
        {#if promise}
            {#await promise}
                {L(__loading)}
            {:then storeList}
                {#each storeList as {id, title} (id)}
                    <div class="store">
                        <label>
                            <input type="checkbox" {id} checked={!excludedStores.includes(id)}>
                            {title}
                        </label>
                    </div>
                {/each}
            {:catch e}
                {L(__error)}
            {/await}
        {/if}
    </div>
{/if}


<style>
    .storelist {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        margin: 10px 0 10px 40px;
    }

    .store {
        line-height: 1.5;
    }
</style>
