<script lang="ts">
    import external from "./externalLink";

    export let icon: string;
    export let href: string;
</script>


<a class="btnv6_blue_hoverfade btn_medium {icon}" use:external {href}>
    <span><i class="ico16"></i>&nbsp;<slot></slot></span>
</a>
