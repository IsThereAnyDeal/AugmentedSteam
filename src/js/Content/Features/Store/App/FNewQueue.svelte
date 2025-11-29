<script lang="ts">
    import {__queue_new, __queue_newTooltip} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import DOMHelper from "@Content/Modules/DOMHelper";
    import {onMount} from "svelte";

    onMount(() => {
        const queue = document.querySelector<HTMLElement>("#nextInDiscoveryQueue");
        if (queue) {
            queue.style.display = "flex";
            queue.style.gap = "1px";
            queue.style.width = "auto";
        }

        DOMHelper.insertScript("scriptlets/Store/App/newQueue.js");
    });
</script>


<div id="es_new_queue" class="btn_next_in_queue btn_next_in_queue_trigger" data-tooltip-text="{L(__queue_newTooltip)}">
    <div class="next_in_queue_content">
        <span class="finish_queue_text">{L(__queue_new)}</span>
    </div>
</div>


<style>
    #es_new_queue {
        width: 150px;
    }

    .btn_next_in_queue::after {
        display: none;
    }
</style>