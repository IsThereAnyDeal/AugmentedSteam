<script lang="ts">
    import {onMount} from "svelte";
    import LocalStorage from "@Core/Storage/LocalStorage";
    import ExpandIcon from "@Content/Icons/ExpandIcon.svelte";
    import ContractIcon from "@Content/Icons/ContractIcon.svelte";
    import SmallSteamButton from "@Content/Steam/SmallSteamButton.svelte";

    interface Props {
        reviewSection: HTMLElement;
    }

    let { reviewSection }: Props = $props();

    let visible: boolean = $state(true);

    async function toggleReviews(event?: MouseEvent) {
        if (event) {
            visible = !visible;
            await LocalStorage.set("show_review_section", visible);
        } else {
            visible = await LocalStorage.get("show_review_section") ?? true;
        }

        reviewSection.style.maxHeight = visible ? "" : "0";
    }

    onMount(() => {
        toggleReviews();
    });
</script>


<SmallSteamButton onclick={toggleReviews}>
    {#if visible}
        <ContractIcon />
    {:else}
        <ExpandIcon />
    {/if}
</SmallSteamButton>


<style>
    :global(.as_review_section) {
        overflow: hidden;
    }
</style>
