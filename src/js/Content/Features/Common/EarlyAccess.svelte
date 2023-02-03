<script lang="ts">
    import {onMount} from "svelte";

    import {Localization} from "../../../modulesCore";

    export let imageUrl: string;
    export let imgHeader: HTMLImageElement;

    let container: HTMLSpanElement;

    onMount(() => {
        container.append(imgHeader);
    })
</script>

<span bind:this={container} class="es_overlay_container">
    <span class="es_overlay">
        <img title="{Localization.str.early_access}" src="{imageUrl}" alt="Early Access banner">
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
</style>