<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__sortBy, __thewordunknown} from "@Strings/_strings";
    import {createEventDispatcher, onMount, tick} from "svelte";
    import type {SortboxChangeEvent} from "@Content/Modules/Widgets/SortboxChangeEvent";

    const dispatch = createEventDispatcher<{
        change: SortboxChangeEvent
    }>();

    export let name: string;
    export let options: Array<[string, string]>;
    export let value: string; // format: {key}_{ASC|DESC}

    let highlighted: string;
    let selected: string;
    let selectedName: string;
    let direction: number;

    let containerNode: HTMLElement;
    let isOpen: boolean = false;

    function clickOutsideHandler(e: MouseEvent): void {
        if (!containerNode.contains(<HTMLElement>e.target)) {
            hide();
        }
    }

    function show(): void {
        document.addEventListener("mousedown", clickOutsideHandler);
        isOpen = true;
    }

    function hide(): void {
        document.removeEventListener("mousedown", clickOutsideHandler);
        isOpen = false;
    }

    function dispatchChange(): void {
        dispatch("change", {
            value,
            key: selected,
            direction
        });
    }

    function select(key: string, name: string): void {
        hide();
        selected = key;
        selectedName = name;
        value = `${selected}_${direction < 0 ? "DESC" : "ASC"}`;
        dispatchChange();
    }

    function reverse(): void {
        direction = direction * -1;
        value = `${selected}_${direction < 0 ? "DESC" : "ASC"}`;
        dispatchChange();
    }

    onMount(() => {
        direction = value.endsWith("_DESC") ? -1 : 1;
        selected = value.replace(/(_ASC|_DESC)$/, "");
        highlighted = selected;
        selectedName = L(__thewordunknown);
        for (let [key, name] of options) {
            if (key === selected) {
                selectedName = name;
                break;
            }
        }

        // Trigger change for initial option
        if (value !== "default_ASC") {
            tick().then(dispatchChange);
        }
    });
</script>


<div class="as-sortbox"
     class:as-sortbox--groups={name === "groups"}
     class:as-sortbox--reviews={name === "reviews"}
     class:as-sortbox--friends={name === "friends"}
>
    <div class="as-sortbox__label">{L(__sortBy)}</div>
    <div class="as-sortbox__container" bind:this={containerNode}>
        <button class="as-sortbox__trigger"
                class:is-open={isOpen}
                on:click={show}>{selectedName}</button>

        <div class="as-dropdown" class:is-open={isOpen}>
            <ul>
                {#each options as [key, name]}
                    <li>
                        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                        <button type="button"
                                class:is-highlighted={highlighted === key}
                                on:mouseover={() => highlighted = key}
                                on:click={() => select(key, name)}
                        >{name}</button>
                    </li>
                {/each}
            </ul>
        </div>
    </div>

    <button type="button" class="as-sortbox__reverse" on:click={reverse}>
        {#if direction < 0}↓{:else}↑{/if}
    </button>
</div>


<style>
    button {
        background: transparent;
        text-align: left;
        border: 0;
        outline: 0;
    }

    .as-sortbox {
        color: #fff;
        float: right;
        margin-top: 4px;
    }
    .as-sortbox--reviews {
        padding: 20px 0 5px 0;
    }
    .as-sortbox--friends, .as-sortbox--groups {
        flex-grow: 2;
        margin-right: 20px;
        margin-top: 0;
        text-align: right;
    }

    .as-sortbox__label {
        font-size: 12px;
        display: inline-block;
        margin-right: 4px;
    }
    .as-sortbox__container {
        display: inline-block;
        vertical-align: middle;
        width: 120px;
        position: relative;
        font-size: 12px;
        text-align: left;
    }
    .as-sortbox__reverse {
        cursor: pointer;
        color: white;
    }
    .as-sortbox__trigger {
        display: block;
        width: 100%;
        color: #67c1f5;
        padding: 0 30px 0 8px;
        font-size: 12px;
        line-height: 21px;
        border: 0;
        border-radius: 3px;
        text-decoration: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        position: relative;
        background: rgba( 103, 193, 245, 0.1 );
    }
    .as-sortbox__trigger.is-open {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        z-index: 91;
        position: relative;
        color: #ffffff;
        background: #67c1f5;
    }
    .as-sortbox__trigger::after {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 20px;
        background: url("https://store.cloudflare.steamstatic.com/public/images/v6/ico/ico_arrow_dn_for_select.png") no-repeat left center;
        content: '';
    }
    .as-dropdown {
        position: relative;
        display: none;
    }
    .as-dropdown.is-open {
        display: block;
    }
    ul {
        list-style-type: none;
        line-height: 22px;
        margin: 0;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 0;
        z-index: 900;
        overflow: auto;
        overflow-x: hidden;
        box-shadow: 0 0 5px 0 #000000;
        background: #417A9B;
    }
    ul button {
        padding: 0 10px;
        display: block;
        width: 100%;
        text-decoration: none;
        color: #e5e4dc;
        white-space: nowrap;
    }
    ul button.is-highlighted {
        color: #ffffff;
        background: #67c1f5 linear-gradient(-60deg, #417a9b 5%, #67c1f5 95%);
    }
</style>
