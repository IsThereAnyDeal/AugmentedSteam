<script lang="ts">
    import AnglesUpIcon from "@Content/Icons/ChevronUpIcon.svelte";
    import AnglesDownIcon from "@Content/Icons/ChevronDownIcon.svelte";

    export let onclick: () => void;
    export  let expanded: boolean
</script>


<button type="button" on:click={onclick}>
    <slot></slot>{#if expanded}<AnglesUpIcon />{:else}<AnglesDownIcon />{/if}
</button>


<style>
    button {
        border-radius: 2px;
        border: none;
        text-decoration: none;
        color: #ebebeb;
        background: #000;
        font-size: 12px;
        line-height: 30px;
        padding: 0 5px;
        display: inline-flex;
        align-items: center;

        &:hover {
            background: #97c0e3;
            color: #000;
        }
    }

    button :global(i) {
        font-size: 1.2em;
        margin-left: 5px;
    }
</style>