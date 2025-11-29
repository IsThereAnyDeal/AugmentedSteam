<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__oneclickgoo} from "@Strings/_strings";
    import DOMHelper from "@Content/Modules/DOMHelper";

    export let appid: number;
    export let sessionId: string;
    export let assetId: string

    function onclick(e: Event): void {
        e.preventDefault();
        DOMHelper.insertScript("scriptlets/Community/Inventory/oneClickGems.js", {sessionId, assetId, appid})
    }
</script>


<div>
    <button type="button" class="as-inv-btn" on:click={onclick}>
        {L(__oneclickgoo)}
    </button>
</div>

