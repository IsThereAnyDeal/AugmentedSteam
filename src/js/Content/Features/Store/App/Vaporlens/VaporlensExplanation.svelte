<script lang="ts" module>
    let counter = 0;
    let openPopover: string|null = $state(null);

    function handleDocumentClick(): void {
        openPopover = null;
    }
</script>

<script lang="ts">
    import {onMount} from "svelte";

    interface Props {
        importance: number;
        point: string;
        explanation: string;
    }

    let { importance, point, explanation }: Props = $props();

    let id = $state() as string;

    function stopPropagation(e: Event): void {
        e.stopPropagation();
    }

    function ontoggle(e: Event, id: string): void {
        e.stopPropagation();

        if (!openPopover) {
            document.addEventListener("click", handleDocumentClick, {once: true});
        }

        if (openPopover === id) {
            document.removeEventListener("click", handleDocumentClick);
            openPopover = null;
        } else {
            openPopover = id;
        }
    }

    onMount(() => {
        id = `vle-${counter}`;
        counter++;
    });
</script>


{#snippet importanceBadge()}
    <span class={["importance-badge", {
            high: importance > 0.6,
            mid: importance <= 0.6 && importance > 0.4,
            low: importance <= 0.4
        }]}>{Math.round(importance*100)}</span>
    <span class="point-text">{point}</span>
{/snippet}

{#if explanation}
    <button type="button" onclick={e => ontoggle(e, id)}>
        {@render importanceBadge()}
    </button>

    {#if openPopover === id}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="popover" aria-label="{point} details" onclick={stopPropagation}>{explanation}</div>
    {/if}
{:else}
    <div class="point-static">
        {@render importanceBadge()}
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
    }

    button {
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

        &:hover,
        &:focus-visible,
        &:active {
            color: #b3dcf7;
            outline: none;
        }
    }

    .point-text {
        flex: 1;
        min-width: 0;
        color: inherit;
    }

    .importance-badge {
        font-size: 12px;
        color: #d3e4f6;
        background: rgba(18, 32, 43, 0.35);
        border-radius: 3px;
        padding: 1px 5px;
        white-space: nowrap;
        font-weight: 500;
        border: 1px solid rgba(92, 112, 132, 0.45);
        text-align: center;
        width: 28px;
        box-sizing: border-box;

        &.high {
            background: #2a475e;
        }
        &.mid {
            background: #1b2838;
        }
        &.low {
            background: #000f18;
        }
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