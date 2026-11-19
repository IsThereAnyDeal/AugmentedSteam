<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__binderView, __theworddefault, __view} from "@Strings/_strings";
    import HoverDropdown from "@Content/Modules/Widgets/HoverDropdown.svelte";
    import BadgeControl from "@Content/Features/Community/Badges/Components/BadgeControl.svelte";

    interface Props {
        ondefault: () => void,
        onbinder: () => void
    }

    let {
        ondefault: ondefault_,
        onbinder: onbinder_
    }: Props = $props();

    let activeText: string = $state(L(__theworddefault));

    function ondefault(): void {
        activeText = L(__theworddefault);
        ondefault_();
    }

    function onbinder(): void {
        activeText = L(__binderView);
        onbinder_();
    }
</script>


<BadgeControl label={L(__view)}>
    <HoverDropdown {activeText}>
        <li><button type="button" onclick={ondefault}>{L(__theworddefault)}</button></li>
        <li><button type="button" onclick={onbinder}>{L(__binderView)}</button></li>
    </HoverDropdown>
</BadgeControl>

