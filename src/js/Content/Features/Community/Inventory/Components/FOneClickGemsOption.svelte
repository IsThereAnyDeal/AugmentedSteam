<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__oneclickgoo} from "@Strings/_strings";
    import DOMHelper from "@Content/Modules/DOMHelper";

    interface Props {
        appid: number;
        sessionId: string;
        assetId: string;
    }

    let { appid, sessionId, assetId }: Props = $props();

    function onclick(e: Event): void {
        e.preventDefault();
        DOMHelper.insertScript("scriptlets/Community/Inventory/oneClickGems.js", {sessionId, assetId, appid})
    }
</script>


<div>
    <button type="button" class="as-inv-btn" {onclick}>
        {L(__oneclickgoo)}
    </button>
</div>

