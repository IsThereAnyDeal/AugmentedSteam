<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__cardsRemain, __mostDrops, __sortBy} from "@Strings/_strings";
    import HoverDropdown from "@Content/Modules/Widgets/HoverDropdown.svelte";
    import BadgeControl from "@Content/Features/Community/Badges/Components/BadgeControl.svelte";

    interface Props {
        isOwnProfile: boolean,
        native: Array<[string, string]>,
        activeText: string,
        ondrops: () => void,
        onremain: () => void
    }

    let {
        isOwnProfile,
        native,
        activeText,
        ondrops: ondrops_,
        onremain: onremain_
    }: Props = $props();

    function ondrops(): void {
        activeText = L(__mostDrops);
        ondrops_();
    }

    function onremain(): void {
        activeText = L(__cardsRemain);
        onremain_();
    }
</script>


<BadgeControl label={L(__sortBy)}>
    <HoverDropdown {activeText}>
        {#each native as [sort, label]}
            <li><a href="?sort={sort}">{label}</a></li>
        {/each}

        {#if isOwnProfile}
            <li><button type="button" onclick={ondrops}>{L(__mostDrops)}</button></li>
            <li><button type="button" onclick={onremain}>{L(__cardsRemain)}</button></li>
        {/if}
    </HoverDropdown>
</BadgeControl>
