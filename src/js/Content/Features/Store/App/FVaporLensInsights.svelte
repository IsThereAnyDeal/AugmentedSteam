<script lang="ts">
    import type {TVaporLensResponse} from "@Background/Modules/VaporLens/_types";
    import VaporlensDetails from "@Content/Features/Store/App/Vaporlens/VaporlensDetails.svelte";

    export let formatter: Intl.NumberFormat;
    export let appid: number;
    export let data: TVaporLensResponse;

    let hasDetails = (data.positives ?? []).length > 0
                  || (data.negatives ?? []).length > 0
                  || (data.gameplay ?? []).length > 0
                  || (data.performance ?? []).length > 0
                  || (data.recommendations ?? []).length > 0
                  || (data.misc ?? []).length > 0
</script>


<div class="vaporlens">
    <div class="header">
        <div>
            <div class="eyebrow">VaporLens Highlights</div>
        </div>
        <a href="https://vaporlens.app/app/{appid}" target="_blank" rel="noopener noreferrer">
            View on VaporLens
        </a>
    </div>

    {#if data.summary?.length || data.categories?.length}
        <div class="intro">
            {#if data.summary?.length}
                <section class="summary-section">
                    <header>Summary</header>
                    <ul>
                        {#each data.summary as line}
                            <li>{line}</li>
                        {/each}
                    </ul>
                </section>
            {/if}

            {#if data.categories?.length}
                <section class="tags">
                    <header>Tags</header>
                    <ul class="categories">
                        {#each data.categories as category}
                            <li>{category}</li>
                        {/each}
                    </ul>
                </section>
            {/if}
        </div>
    {/if}

    {#if hasDetails}
        <div class="sections-grid">
            <VaporlensDetails {formatter} label="Positives" entries={data.positives ?? []} />
            <VaporlensDetails {formatter} label="Negatives" entries={data.negatives ?? []} />
            <VaporlensDetails {formatter} label="Gameplay" entries={data.gameplay ?? []} />
            <VaporlensDetails {formatter} label="Performance" entries={data.performance ?? []} />
            <VaporlensDetails {formatter} label="Recommendations" entries={data.recommendations ?? []} />
            <VaporlensDetails {formatter} label="Misc" entries={data.misc ?? []} />
        </div>
    {/if}
</div>


<style>
    .vaporlens {
        margin: 30px 0;
        padding: 16px 20px 20px;
        background: linear-gradient(135deg, rgba(24, 40, 55, 0.94), rgba(15, 26, 39, 0.94));
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: #c6daef;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
    }

    .header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        flex-wrap: wrap;
    }

    .eyebrow {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #a8cfee;
    }

    a {
        color: #dfeeff;
        background: #1a3b56;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        text-decoration: none;
        font-weight: 500;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.18);

        &:hover,
        &:focus-visible {
            background: #214b6e;
        }
    }

    .intro {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
        gap: 18px;
        align-items: flex-start;
        margin-bottom: 16px;
    }

    .categories {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        & li {
            background: rgba(14, 28, 40, 0.7);
            border: 1px solid rgba(161, 200, 234, 0.35);
            border-radius: 999px;
            padding: 4px 11px;
            font-size: 12px;
            color: #dbeaf8;
            font-weight: 400;
        }
    }

    .tags header {
        font-size: 13px;
        text-transform: uppercase;
        color: #a8ceea;
        margin-bottom: 10px;
        letter-spacing: 0.08em;
    }

    .sections-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 12px;
    }

    .vaporlens :global(section header) {
        font-size: 13px;
        text-transform: uppercase;
        color: #a8ceea;
        margin-bottom: 10px;
        letter-spacing: 0.08em;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .summary-section {
        margin-top: 0;

        & ul {
            list-style: disc;
            padding-left: 20px;
            margin: 0;
        }

        & li {
            padding: 2px 0;
            font-size: 13px;
            line-height: 1.5;
            color: #dbeaf8;
        }
    }


    @media (max-width: 700px) {
        .header {
            flex-direction: column;
            align-items: flex-start;
        }

        a {
            width: 100%;
            text-align: center;
        }
    }

    @media (max-width: 1100px) {
        .sections-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 960px) {
        .intro {
            grid-template-columns: minmax(0, 1fr);
        }

        .summary-section ul {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    @media (max-width: 640px) {
        .sections-grid {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
