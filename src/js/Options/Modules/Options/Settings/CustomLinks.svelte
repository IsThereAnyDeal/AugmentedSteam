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

    export let type: "app"|"profile";

    const key = type === "app" ? "app_custom_link" : "profile_custom_link";
    let customLinks: TCustomLink[] = [];

    function removeLink(index: number): void {
        customLinks.splice(index, 1);
        save();
    }

    function addLink(): void {
        customLinks.push({...DefaultSettings[key][0]});
        save();
    }

    function toggleLink(index: number): void {
        if (!customLinks[index]) {
            return;
        }
        customLinks[index].enabled = !customLinks[index].enabled;
        save();
    }

    function save(): void {
        customLinks = [...customLinks];
        Settings[key] = customLinks;
    }

    onMount(() => {
        customLinks = Settings[key] ?? [];
    });
</script>


<div>
    {#each customLinks as link, index}
        <div class="box" on:change={save} transition:slide={{axis: "y", duration: 200}}>
            <div class="controls">
                <button type="button" class="toggle" on:click={() => toggleLink(index)}>
                    <ToggleIcon on={link.enabled} />
                </button>

                <button type="button" class="delete" on:click={() => removeLink(index)}>
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

    <button type="button" class="add" on:click={addLink}>
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
