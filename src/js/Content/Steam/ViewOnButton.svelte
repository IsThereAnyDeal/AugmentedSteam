<script lang="ts">
    interface Props {
        href: string;
        children?: import('svelte').Snippet;
    }

    let { href, children }: Props = $props();
</script>


<a {href} target="_blank" rel="noopener noreferrer">{@render children?.()}</a>


<style>
    a {
        color: #66c0f4;
        background: #212c3d;
        padding: 0 15px;
        font-size: 15px;
        line-height: 30px;
        text-decoration: none;
        font-weight: 500;
        white-space: nowrap;
        transition: background-color 0.2s ease-out;

        &:hover,
        &:focus-visible {
            background: #66c0f4;
            color: white;
        }
    }
</style>