<svelte:options accessors />

<script lang="ts">
    import {__enterTag} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    export let tag: string;
</script>


<input placeholder="{L(__enterTag)}" bind:value={tag} on:change>


<style>
    input {
        text-transform: capitalize;
    }
    input::placeholder {
        text-transform: none;
    }
</style>
