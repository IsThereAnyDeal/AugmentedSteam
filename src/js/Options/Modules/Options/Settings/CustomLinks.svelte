<script lang="ts">
    import {__options_addCustomLink, __options_icon, __options_name} from "@Strings/_strings";
    import {onMount} from "svelte";
    import {L} from "@Core/Localization/Localization";
    import type {TCustomLink} from "../../../Data/_types";
    import Settings, {DefaultSettings} from "../../../Data/Settings";
    import ToggleIcon from "../../Icons/ToggleIcon.svelte";
    import {slide} from "svelte/transition";
    import DeleteIcon from "../../Icons/DeleteIcon.svelte";
    import AddIcon from "../../Icons/AddIcon.svelte";

    interface Props {
        type: "app"|"profile";
    }

    let { type }: Props = $props();

    let customLinks: TCustomLink[] = $state([]);

    function removeLink(index: number): void {
        customLinks.splice(index, 1);
        save();
    }

    function addLink(): void {
        const defaultLink: TCustomLink = type === "app"
            ? DefaultSettings.app_custom_link[0]!
            : DefaultSettings.profile_custom_link[0]!

        customLinks.push({
            enabled: defaultLink.enabled,
            name: defaultLink.name,
            url: defaultLink.url,
            icon: defaultLink.icon
        });
        save();
    }

    function toggleLink(link: TCustomLink): void {
        link.enabled = !link.enabled;
        save();
    }

    function save(): void {
        customLinks = customLinks;

        if (type === "app") {
            Settings.app_custom_link = customLinks;
        } else {
            Settings.profile_custom_link = customLinks;
        }
    }

    onMount(() => {
        customLinks = (type === "app"
            ? Settings.app_custom_link
            : Settings.profile_custom_link
        ) ?? [];
    });
</script>


<div>
    {#each customLinks as link, index (link)}
        <div class="box" onchange={save} transition:slide={{axis: "y", duration: 200}}>
            <div class="controls">
                <button type="button" class="toggle" onclick={() => toggleLink(link)}>
                    <ToggleIcon on={link.enabled} />
                </button>

                <button type="button" class="delete" onclick={() => removeLink(index)}>
                    <DeleteIcon />
                </button>
            </div>

            <div>
                <label>
                    <span>{L(__options_name)}</span>
                    <input type="text" class="inpt" size="30" maxlength="30" placeholder="Name"
                           bind:value={link.name}>
                </label>

                <label>
                    <span>URL</span>
                    <input type="url" class="inpt" placeholder="URL"
                           bind:value={link.url}>
                </label>

                <label>
                    <span>{L(__options_icon)}</span>
                    <input type="url" class="inpt" placeholder="Icon url"
                           bind:value={link.icon}>
                </label>
            </div>
        </div>
    {/each}

    <button type="button" class="add" onclick={addLink}>
        <AddIcon />
        {L(__options_addCustomLink)}
    </button>
</div>


<style>
    .box + .box {
        margin-top: 15px;
    }


    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .toggle:hover :global(i) {
        color: var(--text-bright);
    }

    .delete:hover :global(i) {
        color: var(--color-error);
    }


    label {
        display: block;
    }
    label + label {
        margin-top: 10px;
    }

    label span {
        display: block;
        font-size: 0.85em;
        margin-bottom: 2px;
    }

    input[type=url] {
        width: 100%;
    }

    .add {
        color: var(--text-color);
        margin-top: 10px;
        padding: 5px 10px;
    }
    .add:hover {
        color: var(--text-bright);
    }
</style>
