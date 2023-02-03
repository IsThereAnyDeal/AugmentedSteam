<script lang="ts">
    import ExternalLink from "../../../ExternalLink.svelte"

    export let cls : string, url : string, str : string;
</script>

<div class="as-community-app-page-link">
    <ExternalLink class="btnv6_blue_hoverfade btn_medium {cls}" href="{url}">
        <span><i class="ico16"></i>&nbsp;{str}</span>
    </ExternalLink>
</div>

<style>
    .as-community-app-page-link {
        display: inline-block;
        margin: 0 .1rem;
    }
</style>