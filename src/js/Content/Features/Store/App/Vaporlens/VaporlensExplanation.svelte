<script lang="ts" context="module">
    import {type Writable, writable} from "svelte/store";

    let counter = 0;
    let openPopover: Writable<string|null> = writable(null);

    function handleDocumentClick(): void {
        openPopover.set(null);
    }
</script>

<script lang="ts">
    import {onMount} from "svelte";

    export let formatter: Intl.NumberFormat;
    export let importance: number;
    export let point: string;
    export let explanation: string;

    let id: string;

    function stopPropagation(e: Event): void {
        e.stopPropagation();
    }

    function togglePopover(e: Event, id: string): void {
        e.stopPropagation();

        if (!$openPopover) {
            document.addEventListener("click", handleDocumentClick, {once: true});
        }

        if ($openPopover === id) {
            document.removeEventListener("click", handleDocumentClick);
            $openPopover = null;
        } else {
            $openPopover = id;
        }
    }

    onMount(() => {
        id = `vle-${counter}`;
        counter++;
    });
</script>


{#if explanation}
    <button type="button" on:click={e => togglePopover(e, id)}>
        <span class="importance-badge">{formatter.format(importance)}</span>
        <span class="point-text">{point}</span>
    </button>

    {#if $openPopover === id}
        <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
        <div class="popover" aria-label="{point} details" on:click={stopPropagation}>{explanation}</div>
    {/if}
{:else}
    <div class="point-static">
        <span class="importance-badge">{formatter.format(importance)}</span>
        <span class="point-text">{point}</span>
    </div>
{/if}


<style>
    button,
    .point-static {
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        color: #d3e4f6;
        font-size: 13px;
        font-weight: 400;
        border-radius: 0;
        padding: 4px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
    }

    button {
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    button:hover,
    button:focus-visible,
    button:active {
        color: #b3dcf7;
        outline: none;
    }

    .point-text {
        flex: 1;
        min-width: 0;
        color: inherit;
    }

    .importance-badge {
        font-size: 10px;
        color: #5c7084;
        background: rgba(18, 32, 43, 0.35);
        border-radius: 3px;
        padding: 1px 5px;
        white-space: nowrap;
        font-weight: 500;
        border: 1px solid rgba(92, 112, 132, 0.45);
        text-align: center;
    }

    div.popover {
        position: absolute;
        left: 0;
        right: 0;
        margin-top: 6px;
        background: rgba(15, 26, 39, 0.98);
        border: 1px solid rgba(143, 206, 247, 0.45);
        border-radius: 6px;
        padding: 10px 12px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        z-index: 5;
        font-size: 13px;
        color: #c7d5e0;
        line-height: 1.4;
    }
</style>