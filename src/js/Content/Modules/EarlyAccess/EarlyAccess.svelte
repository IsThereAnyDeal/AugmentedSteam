<script lang="ts">
    import {onMount} from "svelte";
    import {L} from "@Core/Localization/Localization";
    import {__earlyAccess} from "@Strings/_strings";

    export let imageUrl: string;
    export let imgHeader: HTMLImageElement;

    let container: HTMLSpanElement;

    onMount(() => {
        container.append(imgHeader);
    });
</script>


<span bind:this={container} class="es_overlay_container">
    <span class="es_overlay">
        <img title={L(__earlyAccess)} src={imageUrl} alt="Early Access banner">
    </span>
</span>


<style>
    :global(.home_content_item) .es_overlay_container,
    :global(.small_cap) .es_overlay_container,
    :global(.special.special_img_ctn) .es_overlay_container,
    :global(.game_capsule_ctn) .es_overlay_container,
    :global(.review_app_actions .gameLogoHolder_default) .es_overlay_container {
        position: relative;
        display: inherit;
    }

    :global(.store_capsule) .es_overlay_container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: auto;
        vertical-align: top;
    }
    :global(.store_capsule) .es_overlay_container > :global(img) {
        width: 100%;
    }

    /*
     * The component moves the capsule's own image into .es_overlay_container, which drops
     * any of Steam's rules that positioned that image through a child combinator. The rule
     * above compensates for that on .store_capsule when Steam positions the image
     * absolutely inside a percentage-padding ratio box.
     *
     * A capsule whose image is in flow (img.sale_capsule_image) is laid out the other way
     * round: the image gives the capsule its height, so the container has to stay in flow
     * too or the capsule collapses to the height of its price bar. This is keyed on the image
     * rather than on .sale_capsule:not(.store_capsule) because the daily deals carry both
     * classes yet have been served with both layouts, and the wrong guess collapses them.
     */
    :global(.sale_capsule) .es_overlay_container:global(:has(> img.sale_capsule_image)) {
        position: relative;
        display: inherit;
    }
    :global(.sale_capsule) .es_overlay_container > :global(img.sale_capsule_image) {
        width: 100%;
    }

    .es_overlay,
    .es_overlay img {
        position: absolute;
        z-index: 4; /* Should be lower than .ds_flag (currently 5) */
        width: auto !important;
        height: 60%;
        min-height: 35px;
        max-height: 120px;
        aspect-ratio: 1;
    }
    .es_overlay img {
        position: relative;
        height: 100% !important;
    }

    :global(.home_content.single) .es_overlay {
        z-index: 11;
    }
    :global(.gameListRowLogo) .es_overlay,
    :global(.game_capsule_ctn) .es_overlay {
        height: 70%;
    }
    :global(.gameLogo) .es_overlay {
        height: 50%;
    }
    :global(.curator_featured) .es_overlay {
        height: 25%;
    }
</style>
