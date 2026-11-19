<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__sortBy, __thewordunknown} from "@Strings/_strings";
    import {onMount, tick} from "svelte";
    import CaretDownIcon from "@Content/Icons/CaretDownIcon.svelte";
    import CaretUpIcon from "@Content/Icons/CaretUpIcon.svelte";

    interface Props {
        name: string,
        options: Array<[string, string]>,
        value: string, // format: {key}_{ASC|DESC}
        onchange: (value: string, key: string, direction: number) => void
    }

    let { name, options, value, onchange }: Props = $props();

    let selected: string = $state("");
    let selectedName: string = $state("");
    let direction: number = $derived(1);

    let containerNode = $state() as HTMLElement;
    let isOpen: boolean = $state(false);

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
        onchange(value, selected, direction);
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


<div class={["as-sortbox", {
     "as-groups": name === "groups",
     "as-reviews": name === "reviews",
     "as-friends": name === "friends",
}]}>
    <div class="as-label">{L(__sortBy)}</div>
    <div class="as-container" bind:this={containerNode}>
        <button class={["as-trigger", {
            "is-open": isOpen
        }]} onclick={show}>{selectedName}</button>

        <div class="as-dropdown" class:is-open={isOpen}>
            <ul>
                {#each options as [key, name]}
                    <li><button type="button" onclick={() => select(key, name)}>{name}</button></li>
                {/each}
            </ul>
        </div>
    </div><!--

    --><button type="button" class="as-reverse" onclick={reverse}>
        {#if direction < 0}
            <CaretDownIcon />
        {:else}
            <CaretUpIcon />
        {/if}
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

        &.as-reviews {
            padding: 20px 0 5px 0;
        }
        &.as-friends,
        &.as-groups {
            flex-grow: 2;
            margin-right: 20px;
            margin-top: 0;
            text-align: right;
        }
    }

    .as-label {
        font-size: 12px;
        display: inline-block;
        margin-right: 4px;
    }
    .as-container {
        display: inline-block;
        vertical-align: middle;
        width: 120px;
        position: relative;
        font-size: 12px;
        text-align: left;
    }
    .as-reverse {
        cursor: pointer;
        color: #67c1f5;
        font-size: 1.2em;
        line-height: 1em;
        vertical-align: middle;

        &:hover {
            color: white;
        }
    }
    .as-trigger {
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

        &.is-open {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            z-index: 91;
            position: relative;
            color: #ffffff;
            background: #67c1f5;
        }

        &::after {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 20px;
            background: url("https://store.cloudflare.steamstatic.com/public/images/v6/ico/ico_arrow_dn_for_select.png") no-repeat left center;
            content: '';
        }
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

        &:hover {
            color: #ffffff;
            background: #67c1f5 linear-gradient(-60deg, #417a9b 5%, #67c1f5 95%);
        }
    }
</style>
