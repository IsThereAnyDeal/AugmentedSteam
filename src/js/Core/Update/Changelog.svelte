<script lang="ts">
    import ExtensionResources from "@Core/ExtensionResources";
    import Info from "@Core/Info";
    import {L} from "@Core/Localization/Localization";
    import {__update_changes, __update_updated} from "@Strings/_strings";
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import {createEventDispatcher, onMount} from "svelte";
    import type Version from "@Core/Version";

    const dispatch = createEventDispatcher<{
        close: void
    }>();

    export let lastVersion: Version;

    let promise: Promise<string>

    onMount(() => {
        promise = (async () => {
            const changelog = await ExtensionResources.getJSON<Record<string, string>>("changelog.json");
            const html = changelog[Info.version];
            if (!html) {
                throw new Error(`Can't find changelog for version ${Info.version}`);
            }
            return html;
        })();
    });
</script>


{#if promise}
    {#await promise then html}
        <Modal title={L(__update_updated, {"version": Info.version})}
               showClose
               buttons={{cancel: "OK"}}
               on:button={() => dispatch("close")}
        >
            <div class="changelog">
                <img src={ExtensionResources.getURL("img/logo/as128.png")} alt="Logo">
                <div>
                    {@html html}
                    <p>
                        <a href={`https://github.com/IsThereAnyDeal/AugmentedSteam/compare/v${lastVersion}...v${Info.version}`} target="_blank">
                            {L(__update_changes)}
                        </a>
                    </p>
                </div>
            </div>
        </Modal>
    {/await}
{/if}


<style>
    .changelog {
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        max-width: 800px;
        font-size: 14px;
    }
    .changelog :global(h1) {
        font-size: 18px;
        margin: 20px 0 5px 0;
    }
    .changelog :global(p) {
        margin-bottom: 0.4em;
        font-size: 14px !important;
    }
    .changelog :global(img) {
        margin-right: 21px;
    }
    .changelog :global(ul) {
        list-style-position: outside;
        padding: 0 10px 10px 10px;
        margin: 0 0 0 15px;
    }
    .changelog :global(li) {
        margin-bottom: 3px;
    }
    .changelog :global(a) {
        text-decoration: none;
        color: #ffffff;
    }
    .changelog :global(a:hover) {
        color: #66c0f4;
    }
</style>