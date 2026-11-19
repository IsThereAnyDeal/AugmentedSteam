<script lang="ts">
    import type {Snippet} from "svelte";

    interface Props {
        label: string,
        children: Snippet<[void]>
    }

    let { label, children }: Props = $props();

</script>


<div>
    <span>{label}</span>
    {@render children()}
</div>


<style>
    div {
        float: right;
        display: flex;
        gap: 5px;
        margin-left: 18px;
    }
</style>