<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__badgesAll, __badgesDrops, __show} from "@Strings/_strings";
    import HoverDropdown from "@Content/Modules/Widgets/HoverDropdown.svelte";
    import BadgeControl from "@Content/Features/Community/Badges/Components/BadgeControl.svelte";

    interface Props {
        onall: () => void,
        ondrops: () => void
    }

    let {
        onall: onall_,
        ondrops: ondrops_
    }: Props = $props();

    let activeText: string = $state(L(__badgesAll));

    function onall(): void {
        activeText = L(__badgesAll);
        onall_();
    }

    function ondrops(): void {
        activeText = L(__badgesDrops);
        ondrops_();
    }
</script>


<BadgeControl label={L(__show)}>
    <HoverDropdown {activeText}>
        <li><button type="button" onclick={onall}>{L(__badgesAll)}</button></li>
        <li><button type="button" onclick={ondrops}>{L(__badgesDrops)}</button></li>
    </HoverDropdown>
</BadgeControl>
