<script lang="ts">
    import {__dlcSelect_none, __dlcSelect_unownedDlc, __dlcSelect_wishlistedDlc} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {
        allDlcs,
        ownedDlcs,
        selectedDlcs,
        wishlistedDlcs
    } from "@Content/Features/Store/App/Components/DLCCheckboxes/DLCStores.svelte.js";

    function onselectUnowned() {
        for (const subid of allDlcs) {
            if (!ownedDlcs.has(subid)) {
                selectedDlcs.add(subid);
            }
        }
    }

    function onselectWishlisted() {
        for (const subid of wishlistedDlcs) {
            selectedDlcs.add(subid);
        }
    }

    function onselectNone(): void {
        selectedDlcs.clear();
    }
</script>


<div>
    <button type="button" onclick={onselectUnowned}>{L(__dlcSelect_unownedDlc)}</button>
    <button type="button" onclick={onselectWishlisted}>{L(__dlcSelect_wishlistedDlc)}</button>
    <button type="button" onclick={onselectNone}>{L(__dlcSelect_none)}</button>
</div>


<style>

    div {
        background: linear-gradient(90deg,#0003 0%,#00000080 100%);
        margin-bottom: 1px;
        height: 28px;
        padding-left: 6px;
        display: flex;
        align-items: center;
        gap: 2px;
    }
    button {
        border: 0;
        outline: 0;
        display: inline-block;
        line-height: 19px;
        padding: 0 7px;
        color: #67c1f5;
        background-color: rgba(103, 193, 245, 0.2);
        box-shadow: none;
        border-radius: 2px;
        cursor: pointer;
        font-size: 11px;

        &:hover {
            text-decoration: none;
            color: #ffffff;
            background: linear-gradient(135deg, #67c1f5 0%, #417a9b 100%);
        }
    }
</style>