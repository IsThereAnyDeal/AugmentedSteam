<script lang="ts">
    import Settings from "@Options/Data/Settings";
    import external from "@Content/externalLink";

    export let id: string;
    export let href: string;
    export let iconUrl: string|undefined = undefined;

    const iconType: string = Settings.show_profile_link_images;
    const mainType = iconUrl ? "none" : iconType;
</script>


<div class="es_profile_link profile_count_link">
    <a class="es_sites_icons es_{id}_icon es_{mainType}" {href} use:external>

        {#if iconType !== "none" && iconUrl}
            <i class="es_sites_custom_icon es_{iconType}" style="background-image: url({iconUrl});"></i>
        {/if}

        <span class="count_link_label"><slot></slot></span>
        <span class="profile_count_link_total">&nbsp;</span> <!-- Steam spacing -->
    </a>
</div>
