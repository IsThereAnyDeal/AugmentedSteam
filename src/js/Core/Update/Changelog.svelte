<script lang="ts">
    import ExtensionResources from "@Core/ExtensionResources";
    import Info from "@Core/Info";
    import {L} from "@Core/Localization/Localization";
    import {__update_changes, __update_updatedNoVersion} from "@Strings/_strings";
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import {onMount} from "svelte";
    import Version from "@Core/Version";

    interface Props {
        lastVersion: Version,
        onclose: () => void
    }

    let {
        lastVersion,
        onclose
    }: Props = $props();

    let promise: Promise<[string, string][]> = $state(new Promise(() => {}));

    onMount(() => {
        promise = (async () => {
            const changelog = await ExtensionResources.getJSON<Record<string, string>>("changelog.json");

            let result: Array<[string, string]> = [];
            if (!changelog[Info.version]) {
                throw new Error(`Can't find changelog for version ${Info.version}`);
            }

            result.push([Info.version, changelog[Info.version]!]);

            for (const [version, changes] of Object.entries(changelog)) {
                const changeVersion = Version.fromString(version);
                if (changeVersion.isBefore(Info.version) && changeVersion.isAfter(lastVersion)) {
                    result.push([version, changes]);
                } else if (changeVersion.isSameOrBefore(lastVersion)) {
                    break;
                }
            }

            return result.reverse();
        })();
    });
</script>


{#if promise}
    {#await promise then data}
        <Modal title={L(__update_updatedNoVersion, {"version": Info.version})}
               showClose
               buttons={{cancel: "OK"}}
               onbutton={onclose}
        >
            <div class="changelog">
                <img src={ExtensionResources.getURL("img/logo/as128.png")} alt="Logo">
                <div>
                    {#each data as [version, html]}
                        <h3>{version}</h3>
                        {@html html}
                    {/each}
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
        flex-direction: row-reverse;
        align-items: flex-start;
        max-width: 800px;
        font-size: 14px;
        gap: 20px;
    }
    .changelog :global(h1) {
        font-size: 18px;
        margin: 20px 0 5px 0;
    }
    .changelog :global(p) {
        margin-bottom: 0.4em;
        font-size: 14px !important;
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