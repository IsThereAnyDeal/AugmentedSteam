<script lang="ts">
    interface Props {
        drm: string[];
    }

    let { drm }: Props = $props();
</script>


<ul>
    {#each drm as item}
        <li>{item}</li>
    {/each}
</ul>


<style>
    ul {
        box-sizing: border-box;
        width: 100%;
        padding: 12px 15px;
        background: linear-gradient(to right, #bf3022, #49161a);
        margin-bottom: 10px;
        color: #c6d4df;
    }

    li {
        list-style-type: none;
    }
</style>
