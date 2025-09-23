<script lang="ts">
    import {onMount} from "svelte";
    import {L} from "@Core/Localization/Localization";
    import {__contractSlider, __expandSlider} from "@Strings/_strings";
    import LocalStorage from "@Core/Storage/LocalStorage";

    export let reviewSection: HTMLElement;

    let show: boolean = true;

    async function toggleReviews(event?: MouseEvent) {
        if (event) {
            show = !show;
            LocalStorage.set("show_review_section", show);
        } else {
            show = await LocalStorage.get("show_review_section") ?? true;
        }

        reviewSection.style.maxHeight = show ? "" : "0";
    }

    onMount(() => {
        toggleReviews();
    });
</script>


<!--
 Intentionally using 2 elements because tooltips are stored internally by jQuery,
 and changing the attribute will not change the tooltip. Removing the elements will also not remove the hover tooltips,
 and will cause weird overlaps, plus having to wrap these elements in an extra div to trigger Steam's mutation
 observer for tooltips.
-->
<button class="btnv6_lightblue_blue btn_medium es_review_toggle" on:click={toggleReviews}>
    <span data-tooltip-text="{L(__expandSlider)}" class:inactive={show}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M342.6 534.6C330.1 547.1 309.8 547.1 297.3 534.6L137.3 374.6C124.8 362.1 124.8 341.8 137.3 329.3C149.8 316.8 170.1 316.8 182.6 329.3L320 466.7L457.4 329.4C469.9 316.9 490.2 316.9 502.7 329.4C515.2 341.9 515.2 362.2 502.7 374.7L342.7 534.7zM502.6 182.6L342.6 342.6C330.1 355.1 309.8 355.1 297.3 342.6L137.3 182.6C124.8 170.1 124.8 149.8 137.3 137.3C149.8 124.8 170.1 124.8 182.6 137.3L320 274.7L457.4 137.4C469.9 124.9 490.2 124.9 502.7 137.4C515.2 149.9 515.2 170.2 502.7 182.7z"/></svg>
    </span>
    <span data-tooltip-text="{L(__contractSlider)}" class:inactive={!show}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M342.6 105.4C330.1 92.9 309.8 92.9 297.3 105.4L137.3 265.4C124.8 277.9 124.8 298.2 137.3 310.7C149.8 323.2 170.1 323.2 182.6 310.7L320 173.3L457.4 310.6C469.9 323.1 490.2 323.1 502.7 310.6C515.2 298.1 515.2 277.8 502.7 265.3L342.7 105.3zM502.6 457.4L342.6 297.4C330.1 284.9 309.8 284.9 297.3 297.4L137.3 457.4C124.8 469.9 124.8 490.2 137.3 502.7C149.8 515.2 170.1 515.2 182.6 502.7L320 365.3L457.4 502.6C469.9 515.1 490.2 515.1 502.7 502.6C515.2 490.1 515.2 469.8 502.7 457.3z"/></svg>
    </span>
</button>


<style>
    :global(.es_review_section) {
        overflow: hidden;
    }
    .es_review_toggle {
        float: right;
        font-size: 18px;
    }
    .inactive {
        display: none;
    }

    button > span {
        padding: 0 5px;
    }

    svg {
        height: 1.5em;
    }
</style>
