<script lang="ts">
    import {type Snippet, untrack} from "svelte";

    interface Props {
        min: number
        max: number,
        step: number,
        minValue: number,
        maxValue: number,
        onchange: () => void,
        children: Snippet<[void]>
    }

    let {
        min, max, step,
        minValue = $bindable(),
        maxValue = $bindable(),
        onchange,
        children
    }: Props = $props();


    $effect(() => {
        minValue;
        untrack(() => {
            if (minValue > maxValue) {
                minValue = maxValue;
            }
        });
    });

    $effect(() => {
        maxValue;
        untrack(() => {
            if (maxValue < minValue) {
                maxValue = minValue;
            }
        });
    });
</script>


<div class="range_container">
    <div class="as-slider range_container_inner">
        <input class="range_input" type="range" {min} {max} {step} bind:value={maxValue} {onchange}>
        <input class="range_input" type="range" {min} {max} {step} bind:value={minValue} {onchange}>
    </div>
    <div class="as-range-display">{@render children()}</div>
</div>


<style>
    .as-slider {
        display: grid;
    }

    input {
        grid-row-start: 1;
        grid-column-start: 1;
    }

    .as-range-display {
        font-size: 13px;
        color: #9fbbcb;
        white-space: normal;
        line-height: unset;
        padding: 7.5px 8px; /* 7.5px is the (line-height (28px) - font-size (13px)) / 2 */
    }

    /*
     * Firefox' range input elements ignore certain properties, in particular "position",
     * which restricts us from setting z-indexes.
     *
     * These rules allow the thumb with the lower stack level to receive all inputs events
     * that the user would expect it to.
     * Otherwise, due to the track of the other range input actually overlapping the lower
     * stacked input (but not visually), some pointer events would unintentionally target the
     * higher stacked input, although intended otherwise.
     *
     * A consequence of this workaround is that the track itself is not clickable anymore
     * and the thumbs have to be dragged to change their value.
     *
     * See https://css-tricks.com/sliding-nightmare-understanding-range-input/ for more
     * compatibility problems.
     */

    /* Displays the lower stacked thumb above higher stacked track */
    input::-webkit-slider-thumb {
        position: relative;
    }

    /* Fixes overlapping of track with thumb */
    input:nth-of-type(2)::-moz-range-track {
        background-color: transparent;
    }

    /* Disallow clicking anywhere on the range input... */
    @supports (-moz-appearance:none) {
        input {
            pointer-events: none;
        }
    }

    /* ...except on the thumbs. */
    input::-moz-range-thumb {
        pointer-events: all;
    }
</style>