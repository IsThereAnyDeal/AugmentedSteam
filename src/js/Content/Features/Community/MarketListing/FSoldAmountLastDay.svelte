<script lang="ts">
    import {__soldLast_24} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        volume: number
    }

    let { volume }: Props = $props();
</script>

<div>
    {L(__soldLast_24, { "sold": volume ?? 0 })}
</div>


<style>
    div {
        font-size: var(--text-size-4);
        flex-grow: 1;
        display: flex;
        align-items: flex-end;
    }
</style>