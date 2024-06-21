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
    <div data-tooltip-text="{L(__expandSlider)}" class:inactive={show}>▼</div>
    <div data-tooltip-text="{L(__contractSlider)}" class:inactive={!show}>▲</div>
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
</style>
