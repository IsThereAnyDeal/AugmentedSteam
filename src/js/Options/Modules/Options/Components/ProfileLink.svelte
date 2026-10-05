<script lang="ts">
    import ProfileLinkIcon from "@Icons/ProfileLinkIcon.svelte";
    import type {SettingsSchema} from "@Options/Data/_types";

    interface Props {
        id: string;
        type: SettingsSchema['show_profile_link_images'];
        children?: import('svelte').Snippet;
    }

    let { id, type, children }: Props = $props();
</script>


<span>
    {#if type !== "none"}
        <ProfileLinkIcon {id} gray={type === "gray"} />
    {/if}
    {@render children?.()}
</span>


<style>
    span {
        display: inline-flex;
        align-items: center;
        position: relative;
    }
    span:has(:global(i)) {
        top: 2px;
    }
</style>
