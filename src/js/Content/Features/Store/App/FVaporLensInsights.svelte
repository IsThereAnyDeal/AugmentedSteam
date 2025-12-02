<script lang="ts">
    import { onMount } from "svelte";
    import type { VaporLensSection } from "./VaporLens.types";

    export let appName: string|undefined;
    export let categories: string[] = [];
    export let summary: string[] = [];
    export let sections: VaporLensSection[] = [];
    export let sourceUrl: string;

    const importanceFormatter = new Intl.NumberFormat(
        document.documentElement.lang || navigator.language,
        {style: "percent", maximumFractionDigits: 0}
    );

    let openPopover: string|null = null;

    function togglePopover(id: string) {
        openPopover = openPopover === id ? null : id;
    }

    function getEntryId(sectionKey: string, index: number) {
        return `${sectionKey}-${index}`;
    }

    onMount(() => {
        const handleDocumentClick = () => {
            openPopover = null;
        };

        document.addEventListener("click", handleDocumentClick);

        return () => {
            document.removeEventListener("click", handleDocumentClick);
        };
    });
</script>

<div class="block responsive_apppage_reviewblock vaporlens">
    <div class="header">
        <div>
            <div class="eyebrow">VaporLens Highlights</div>
        </div>
        <a class="cta" href={sourceUrl} target="_blank" rel="noopener noreferrer">
            View on VaporLens
        </a>
    </div>

    {#if summary.length || categories.length}
        <div class="intro">
            {#if summary.length}
                <section class="section summary-section">
                    <header>Summary</header>
                    <ul>
                        {#each summary as line, index}
                            <li data-index={index}>{line}</li>
                        {/each}
                    </ul>
                </section>
            {/if}

            {#if categories.length}
                <div class="tags">
                    <header>Tags</header>
                    <ul class="categories">
                        {#each categories as category (category)}
                            <li>{category}</li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </div>
    {/if}

    {#if sections.length}
        <div class="sections-grid">
            {#each sections as section (section.key)}
                <section class="section category-section">
                    <header>{section.label}</header>
                    <ul>
                        {#if !section.entries.length}
                            <li class="empty">
                                No {section.label.toLowerCase()} insights yet.
                            </li>
                        {:else}
                            {#each section.entries as entry, index}
                                <li data-index={index}>
                                    {#if entry.explanation}
                                        <button
                                            type="button"
                                            class="point-button"
                                            on:click|stopPropagation={() => togglePopover(getEntryId(section.key, index))}
                                            aria-expanded={openPopover === getEntryId(section.key, index)}
                                            aria-controls={`vaporlens-popover-${getEntryId(section.key, index)}`}
                                        >
                                            {#if typeof entry.importance === "number"}
                                                <span class="importance-badge">
                                                    {importanceFormatter.format(entry.importance)}
                                                </span>
                                            {/if}
                                            <span class="point-text">{entry.point}</span>
                                        </button>
                                        {#if openPopover === getEntryId(section.key, index)}
                                            <div
                                                class="popover"
                                                id={`vaporlens-popover-${getEntryId(section.key, index)}`}
                                                role="dialog"
                                                aria-label={`${entry.point} details`}
                                                on:click|stopPropagation
                                            >
                                                <p>{entry.explanation}</p>
                                            </div>
                                        {/if}
                                    {:else}
                                        <div class="point-static">
                                            {#if typeof entry.importance === "number"}
                                                <span class="importance-badge">
                                                    {importanceFormatter.format(entry.importance)}
                                                </span>
                                            {/if}
                                            <span class="point-text">{entry.point}</span>
                                        </div>
                                    {/if}
                                </li>
                            {/each}
                        {/if}
                    </ul>
                </section>
            {/each}
        </div>
    {/if}
</div>

<style>
    :global(.vaporlens.block) {
        margin-top: 10px;
    }

    .vaporlens {
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

    .cta {
        color: #dfeeff;
        background: #1a3b56;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        text-decoration: none;
        font-weight: 500;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .cta:hover,
    .cta:focus-visible {
        background: #214b6e;
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
    }

    .categories li {
        background: rgba(14, 28, 40, 0.7);
        border: 1px solid rgba(161, 200, 234, 0.35);
        border-radius: 999px;
        padding: 4px 11px;
        font-size: 12px;
        color: #dbeaf8;
        font-weight: 400;
    }

    .section {
        margin-top: 18px;
    }

    .summary-section {
        margin-top: 0;
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

    .sections-grid .section {
        margin-top: 0;
    }

    .section header {
        font-size: 13px;
        text-transform: uppercase;
        color: #a8ceea;
        margin-bottom: 10px;
        letter-spacing: 0.08em;
    }

    .section ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .summary-section ul {
        list-style: disc;
        padding-left: 20px;
        margin: 0;
    }

    .summary-section li {
        padding: 2px 0;
        font-size: 13px;
        line-height: 1.5;
        color: #dbeaf8;
    }

    .category-section ul {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .category-section li {
        position: relative;
    }

    .point-button,
    .point-static {
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        color: #d3e4f6;
        font-size: 13px;
        font-weight: 400;
        border-radius: 0;
        padding: 4px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
    }

    .point-button {
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .point-button:hover,
    .point-button:focus-visible,
    .point-button[aria-expanded="true"] {
        color: #b3dcf7;
        outline: none;
    }

    .point-text {
        flex: 1;
        min-width: 0;
        color: inherit;
    }

    .importance-badge {
        font-size: 10px;
        color: #5c7084;
        background: rgba(18, 32, 43, 0.35);
        border-radius: 3px;
        padding: 1px 5px;
        white-space: nowrap;
        font-weight: 500;
        border: 1px solid rgba(92, 112, 132, 0.45);
        text-align: center;
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

    .popover {
        position: absolute;
        left: 0;
        right: 0;
        margin-top: 6px;
        background: rgba(15, 26, 39, 0.98);
        border: 1px solid rgba(143, 206, 247, 0.45);
        border-radius: 6px;
        padding: 10px 12px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        z-index: 5;
    }

    .popover p {
        margin: 0;
        font-size: 13px;
        color: #c7d5e0;
        line-height: 1.4;
    }

    @media (max-width: 700px) {
        .header {
            flex-direction: column;
            align-items: flex-start;
        }

        .cta {
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
