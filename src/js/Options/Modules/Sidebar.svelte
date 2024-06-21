<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __about,
        __community,
        __news,
        __options_apppage,
        __options_general,
        __price,
        __store
    } from "@Strings/_strings";

    const setup: Array<Array<[string, string]>> = [
        [
            ["general", L(__options_general)],
            ["itad", "IsThereAnyDeal"],
            ["store", L(__store)],
            ["app", L(__options_apppage)],
            ["price", L(__price)],
            ["community", L(__community)]
        ],
        [
            ["about", L(__about)],
            ["changelog", L(__news)]
        ]
    ];

    function select(value: string) {
        selected = value;
        window.location.hash = value;
    }

    export let selected: string = setup[0]![0]![0];
</script>

<div class="sidebar">
    {#each setup as group}
        <div class="sidebar__group">
            {#each group as [value, locale]}
                <button type="button"
                        class:is-selected={selected === value}
                        on:click={() => select(value)}>{locale}</button>
            {/each}
        </div>
    {/each}
</div>


<style>
    .sidebar {
        position: sticky;
        top: 30px;
        bottom: 30xp;
        max-height: 100vh;
        scrollbar-width: thin;
        box-sizing: border-box;
    }

    .sidebar__group {
        background: var(--sidebar-bg-color);
        padding: 10px;
        border-radius: 10px;
    }

    .sidebar__group + .sidebar__group {
        margin-top: 15px;
    }

    button {
        width: 100%;
        text-align: left;
        display: block;
        font-size: 15px;
        padding: 5px 10px;
        border-radius: 4px;
    }
    button:hover {
        background: var(--sidebar-bg-hover-color);
        color: white;
    }
    button.is-selected {
        background: var(--sidebar-bg-hover-color);
        border-right: 4px solid var(--highlight-color);
    }
    button + button {
        margin-top: 5px;
    }
</style>
