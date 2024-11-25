<script lang="ts">
    export let label: string;
</script>


<button type="button" on:click>{label}</button>


<style>
    button {
        background-color: #6c94a0;
        margin-right: 15px;
        text-transform: uppercase;
        text-decoration: none;
        text-align: center;
        display: block;
        padding: 0 20px;
        border: 0;
        border-radius: 1px;
        color: #fff;
        cursor: pointer;
        margin-left: 2px;
        font-size: 11px;
    }
    button:hover {
        background-color: #dbdee1;
        color: black;
    }
</style>