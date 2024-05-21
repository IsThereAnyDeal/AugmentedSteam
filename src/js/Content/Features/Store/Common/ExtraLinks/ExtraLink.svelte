<script lang="ts">
    export let href: string;
    export let icon: string = "";
    export let iconUrl: string|null = null;
</script>


<a class="btnv6_blue_hoverfade btn_medium es_app_btn {icon}" target="_blank" {href}>
    <span>
        {#if iconUrl}
            <i class="ico16" style="background: url({iconUrl}); background-size: contain;"></i>
        {:else}
            <i class="ico16"></i>
        {/if}
        <slot></slot>
    </span>
</a>
