<script lang="ts">
    import {onMount} from "svelte";
    import type Language from "@Core/Localization/Language";
    import EarlyAccessSash from "@Content/Modules/EarlyAccess/EarlyAccessSash.svelte";

    interface Props {
        language: Language|null;
        capsule: HTMLImageElement;
    }

    let { language, capsule }: Props = $props();

    let container = $state() as HTMLSpanElement;

    onMount(() => {
        container.append(capsule);
    });
</script>


<span bind:this={container} class="as_ea_container">
    <span class="as_ea">
        <EarlyAccessSash {language} />
    </span>
</span>


<style>
    .as_ea_container {
        position: relative;
        display: inherit;
    }

    .as_ea {
        position: absolute;
        z-index: 4; /* Should be lower than .ds_flag (currently 5) */
        width: auto;
        height: 60%;
        aspect-ratio: 1;

        & > :global(img) {
            height: 100% !important;
        }
    }
</style>
