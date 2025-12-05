<script lang="ts">
    import {__enterTag} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        tag: string;
        onchange: (e: Event) => void
    }

    let {
        tag = $bindable(),
        onchange
    }: Props = $props();

    export {
    	tag,
    }
</script>


<input placeholder="{L(__enterTag)}" bind:value={tag} {onchange}>


<style>
    input {
        text-transform: capitalize;
    }
    input::placeholder {
        text-transform: none;
    }
</style>
