<script lang="ts">
    import {__achievements_summary} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        unlocked: number;
        total: number;
        percentage: number;
    }

    let { unlocked, total, percentage }: Props = $props();
</script>


<div class="achievements">
    <div>{L(__achievements_summary, {unlocked, total, percentage})}</div>

    <div class="bar">
        <div style:width="{percentage}%" class="progress"></div>
    </div>
</div>


<style>
    .achievements {
        color: var(--color-text-body-body);
        background: #191d2580;
        padding: 10px;
    }

    .bar {
        background: var(--color-dull-1);
        width: 100%;
        height: 10px;
        border-radius: 5px;
        overflow: hidden;
    }
    .progress {
        height: 100%;
        background: var(--color-blue-8);
    }
</style>
