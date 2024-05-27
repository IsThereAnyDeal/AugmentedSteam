<script lang="ts">
    import {__achievements_summary} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    export let unlocked: number;
    export let total: number;
    export let percentage: number;

    let achievementStr = L(__achievements_summary, {
        "unlocked": unlocked,
        "total": total,
        "percentage": percentage
    });
</script>


<div class="es_achievebar_ctn">
    <div>{achievementStr}</div>
    <div class="es_achievebar">
        <div style:width="{percentage}%" class="es_achievebar_progress"></div>
    </div>
</div>


<style>
    .es_achievebar_ctn {
        float: right;
    }
    .es_achievebar {
        background: #3a3a3a;
        padding: 1px;
        border: 1px solid #aeaeae;
        width: 176.9px;
    }
    .es_achievebar_progress {
        height: 8px;
        background-color: #aeaeae;
    }
</style>
