<script lang="ts">
    import type {TVaporLensEntry} from "@Background/Modules/VaporLens/_types";
    import VaporlensExplanation from "@Content/Features/Store/App/Vaporlens/VaporlensExplanation.svelte";

    export let formatter: Intl.NumberFormat;
    export let label: string;
    export let entries: TVaporLensEntry[];
</script>


<section class="section category-section">
    <header>{label}</header>
    <ul>
        {#if !entries.length}
            <li class="empty">
                No {label.toLowerCase()} insights yet.
            </li>
        {:else}
            {#each entries as entry}
                {#if entry.explanation && entry.importance}
                    <li>
                        <VaporlensExplanation {formatter}
                                point={entry.point || (entry.explanation ? entry.explanation.slice(0, 64) : "Insight")}
                                explanation={entry.explanation}
                                importance={entry.importance} />
                    </li>
                {/if}
            {/each}
        {/if}
    </ul>
</section>


<style>
    section {
        margin-top: 0;
    }

    .empty {
        padding: 4px 0;
        border-radius: 0;
        background: transparent;
        border: 0;
        color: #8ea4ba;
        font-size: 13px;
        font-style: italic;
        text-align: left;
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 4px;
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        position: relative;
    }
</style>