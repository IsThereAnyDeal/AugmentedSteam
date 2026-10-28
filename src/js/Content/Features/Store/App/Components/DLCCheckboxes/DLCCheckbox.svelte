<script lang="ts">
    import SubId from "@Core/GameId/SubId";
    import {selectedDlcs} from "@Content/Features/Store/App/Components/DLCCheckboxes/DLCStores.svelte.js";

    interface Props {
        subid: SubId
    }

    let { subid }: Props = $props();

    function onclick(e: Event): void {
        e.stopPropagation();

        if (selectedDlcs.has(subid.number)) {
            selectedDlcs.delete(subid.number);
        } else {
            selectedDlcs.add(subid.number);
        }
    }
</script>


<div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
    <label {onclick}>
        <input type="checkbox" checked={selectedDlcs.has(subid.number)} />
    </label>
</div>


<style>
    :global(.as-dlc-row) {
        &:hover label,
        & label:has(:checked) {
            left: 0;
            width: 25px;
            opacity: 1;
        }
    }

    div {
        position: absolute;
        top: 0;
        bottom: 0;
        left: -26px;
        width: 26px;
    }

    label {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 26px;
        width: 0;
        box-sizing: border-box;
        border-right: 1px solid transparent;
        border-radius: 2px 0 0 2px;
        background: #313a46;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition:
                width 200ms ease,
                left 200ms ease,
                opacity 200ms ease;

        &:hover, &:hover:has(:checked) {
            background: #417a9b;
        }
        &:has(:checked) {
            background: #546371;
        }
    }

    input {
        cursor: pointer;
        appearance: none;
        background: #545454;
        padding: 6px;
        border-radius: 4px;
        border: 1px solid #343434;
        outline: none;

        &:checked {
            background: #1a9fff;
        }
    }
</style>
