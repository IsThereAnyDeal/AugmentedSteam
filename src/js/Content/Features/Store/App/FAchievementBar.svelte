<script lang="ts">
    import {__achievements_summary} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    interface Props {
        unlocked: number,
        total: number,
        percentage: number,
        inActivity?: boolean
    }

    let { unlocked, total, percentage, inActivity = false }: Props = $props();
</script>


<div class={["achievements", {"in-activity": inActivity}]}>
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
        border-radius: 2px;

        &.in-activity {
            float: right;
            padding: 7px 10px;
            min-width: 280px;
            position: relative;
            top: -3px;
            background: #00000033;
        }
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
