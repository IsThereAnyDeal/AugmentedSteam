<script lang="ts">
    import type {TSyncEvent} from "@Background/Modules/IsThereAnyDeal/_types";

    export let events: TSyncEvent[];
</script>


<div class="events">
    {#each events as event}
        <div class="event">
            <div class="timestamp">{new Date(event.timestamp * 1000).toLocaleString()}</div>
            <div class="type">{event.type}</div>
            <div>{event.section}</div>
            <div>{event.count}</div>
        </div>
    {:else}
        No sync events
    {/each}
</div>


<style>
    .events {
        padding: 15px;
        line-height: 1.5;
        background: #1a1c21;
        border: 1px dashed #333643;
        border-radius: 10px;
        font-size: 12px;
    }

    .event {
        display: grid;
        grid-template-columns: 130px 50px 90px auto;
        align-items: baseline;
    }

    .timestamp {
        color: #8f98a0;
    }
    .type {
        color: #8f98a0;
        font-size: 10px;
        text-transform: uppercase;
    }
</style>
