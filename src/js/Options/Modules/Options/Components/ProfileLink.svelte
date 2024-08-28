<script lang="ts">
    import ProfileLinkIcon from "@Icons/ProfileLinkIcon.svelte";
    import type {SettingsSchema} from "@Options/Data/_types";

    export let id: string;
    export let type: SettingsSchema['show_profile_link_images'];
</script>


<span>
    {#if type !== "none"}
        <ProfileLinkIcon {id} gray={type === "gray"} />
    {/if}
    <slot></slot>
</span>


<style>
    span {
        display: inline-flex;
        align-items: center;
        position: relative;
    }
    span:has(i) {
        top: 2px;
    }
</style>
