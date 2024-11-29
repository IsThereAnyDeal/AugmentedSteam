<script lang="ts">
    export let label: string;

    export let destructive: boolean = false;
</script>


<button type="button" class:destructive on:click>{label}</button>


<style>
    button {
        background-color: #6c94a0;
        text-transform: uppercase;
        text-decoration: none;
        text-align: center;
        display: block;
        padding: 0 20px;
        border: 0;
        border-radius: 1px;
        color: #fff;
        cursor: pointer;
        font-size: 11px;
        height: 100%;
    }
    button:hover {
        background-color: #dbdee1;
        color: black;
    }

    .destructive {
        background-color: #bf5a5a;
    }
    .destructive:hover {
        background-color: #ffd1d1;
    }
</style>