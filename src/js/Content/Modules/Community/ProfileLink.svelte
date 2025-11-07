<script lang="ts">
    import Settings from "@Options/Data/Settings";
    import external from "@Content/externalLink";
    import ProfileLinkIcon from "@Icons/ProfileLinkIcon.svelte";

    interface Props {
        id: string;
        href: string;
        iconUrl?: string|undefined;
        children?: import('svelte').Snippet;
    }

    let {
        id,
        href,
        iconUrl = undefined,
        children
    }: Props = $props();

    const iconType: "gray"|"color"|"none" = Settings.show_profile_link_images;
</script>


<div class="profile_count_link">
    <a class="link" {href} use:external>
        {#if iconType !== "none"}
            <ProfileLinkIcon {id} {iconUrl} gray={iconType === "gray"} />
        {/if}
        <span class="count_link_label">{@render children?.()}</span>
        <span class="profile_count_link_total">&nbsp;</span> <!-- Steam spacing -->
    </a>
</div>


<style>
    .link {
        display: inline-flex;
        align-items: center;
    }
</style>
