<script lang="ts">
    import {__loading} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import DOMPurify from "dompurify";
    import {onMount} from "svelte";
    import ExtensionResources from "@Core/ExtensionResources";

    let log: Array<[string, string]> = [];
    let promise: Promise<void>|null = null;

    onMount(() => {
        promise = (async () => {
            log = Object.entries(await ExtensionResources.getJSON("changelog.json"));
        })();
    });
</script>


<div>
    {#if promise}
        {#await promise}
            {L(__loading)}
        {:then _}
            <div>
                {#each log as [version, data]}
                    <div class="release">
                        <h2 class="version">{version}</h2>
                        <div class="log">{@html DOMPurify.sanitize(data)}</div>
                    </div>
                {/each}
            </div>
        {/await}
    {/if}
</div>


<style>
    .release {
        margin-bottom: 100px;
    }

    .version {
        display: inline-block;
        font-size: 4.5rem;
        font-weight: bold;
        color: #333643;
        margin: 0;
        padding: 0;
    }

    .log {
        line-height: 1.75;
        padding-left: 50px;
    }
</style>
