<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();</script>


<div>
    <img src="https://community.cloudflare.steamstatic.com/public/images/login/throbber.gif" alt="">
    <span>{@render children?.()}</span>
</div>

<style>
    span {
        vertical-align: top;
        line-height: 32px;
        margin-left: 5px;
    }
</style>