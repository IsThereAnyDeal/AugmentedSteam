<script lang="ts">
    import { createBubbler } from 'svelte/legacy';

    const bubble = createBubbler();
    import {__enterTag} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        tag: string;
    }

    let { tag = $bindable() }: Props = $props();

    export {
    	tag,
    }
</script>


<input placeholder="{L(__enterTag)}" bind:value={tag} onchange={bubble('change')}>


<style>
    input {
        text-transform: capitalize;
    }
    input::placeholder {
        text-transform: none;
    }
</style>
