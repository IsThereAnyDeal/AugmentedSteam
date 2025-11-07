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

<div class="block responsive_apppage_reviewblock es-vaporlens">
    <div class="es-vaporlens__header">
        <div>
            <div class="es-vaporlens__eyebrow">VaporLens Highlights</div>
        </div>
        <a class="es-vaporlens__cta" href={sourceUrl} target="_blank" rel="noopener noreferrer">
            View on VaporLens
        </a>
    </div>

    {#if summary.length || categories.length}
        <div class="es-vaporlens__intro">
            {#if summary.length}
                <section class="es-vaporlens__section es-vaporlens__section--summary">
                    <header>Summary</header>
                    <ul>
                        {#each summary as line, index}
                            <li data-index={index}>{line}</li>
                        {/each}
                    </ul>
                </section>
            {/if}

            {#if categories.length}
                <div class="es-vaporlens__tags">
                    <header>Tags</header>
                    <ul class="es-vaporlens__categories">
                        {#each categories as category (category)}
                            <li>{category}</li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </div>
    {/if}

    {#if sections.length}
        <div class="es-vaporlens__sections-grid">
            {#each sections as section (section.key)}
                <section class="es-vaporlens__section es-vaporlens__section--category">
                    <header>{section.label}</header>
                    <ul>
                        {#if !section.entries.length}
                            <li class="es-vaporlens__empty">
                                No {section.label.toLowerCase()} insights yet.
                            </li>
                        {:else}
                            {#each section.entries as entry, index}
                                <li data-index={index}>
                                    {#if entry.explanation}
                                            <button
                                                type="button"
                                                class="es-vaporlens__point-button"
                                                on:click|stopPropagation={() => togglePopover(getEntryId(section.key, index))}
                                                aria-expanded={openPopover === getEntryId(section.key, index)}
                                                aria-controls={`es-vaporlens-popover-${getEntryId(section.key, index)}`}
                                            >
                                                {#if typeof entry.importance === "number"}
                                                    <span class="es-vaporlens__importance-badge">
                                                        {importanceFormatter.format(entry.importance)}
                                                    </span>
                                                {/if}
                                                <span class="es-vaporlens__point-text">{entry.point}</span>
                                            </button>
                                        {#if openPopover === getEntryId(section.key, index)}
                                            <div
                                                class="es-vaporlens__popover"
                                                id={`es-vaporlens-popover-${getEntryId(section.key, index)}`}
                                                role="dialog"
                                                aria-label={`${entry.point} details`}
                                                on:click|stopPropagation
                                            >
                                                <p>{entry.explanation}</p>
                                            </div>
                                        {/if}
                                    {:else}
                                        <div class="es-vaporlens__point-static">
                                            {#if typeof entry.importance === "number"}
                                                <span class="es-vaporlens__importance-badge">
                                                    {importanceFormatter.format(entry.importance)}
                                                </span>
                                            {/if}
                                            <span class="es-vaporlens__point-text">{entry.point}</span>
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
    :global(.es-vaporlens.block) {
        margin-top: 10px;
    }

    .es-vaporlens {
        padding: 16px 20px 20px;
        background: linear-gradient(135deg, rgba(24, 40, 55, 0.94), rgba(15, 26, 39, 0.94));
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: #c6daef;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
    }

    .es-vaporlens__header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        flex-wrap: wrap;
    }

    .es-vaporlens__eyebrow {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #a8cfee;
    }

    .es-vaporlens__cta {
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

    .es-vaporlens__cta:hover,
    .es-vaporlens__cta:focus-visible {
        background: #214b6e;
    }

    .es-vaporlens__intro {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
        gap: 18px;
        align-items: flex-start;
        margin-bottom: 16px;
    }

    .es-vaporlens__categories {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .es-vaporlens__categories li {
        background: rgba(14, 28, 40, 0.7);
        border: 1px solid rgba(161, 200, 234, 0.35);
        border-radius: 999px;
        padding: 4px 11px;
        font-size: 12px;
        color: #dbeaf8;
        font-weight: 400;
    }

    .es-vaporlens__section {
        margin-top: 18px;
    }

    .es-vaporlens__section--summary {
        margin-top: 0;
    }

    .es-vaporlens__tags header {
        font-size: 13px;
        text-transform: uppercase;
        color: #a8ceea;
        margin-bottom: 10px;
        letter-spacing: 0.08em;
    }

    .es-vaporlens__sections-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-top: 12px;
    }

    .es-vaporlens__sections-grid .es-vaporlens__section {
        margin-top: 0;
    }

    .es-vaporlens__section header {
        font-size: 13px;
        text-transform: uppercase;
        color: #a8ceea;
        margin-bottom: 10px;
        letter-spacing: 0.08em;
    }

    .es-vaporlens__section ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .es-vaporlens__section--summary ul {
        list-style: disc;
        padding-left: 20px;
        margin: 0;
    }

    .es-vaporlens__section--summary li {
        padding: 2px 0;
        font-size: 13px;
        line-height: 1.5;
        color: #dbeaf8;
    }

    .es-vaporlens__section--category ul {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .es-vaporlens__section--category li {
        position: relative;
    }

    .es-vaporlens__point-button,
    .es-vaporlens__point-static {
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

    .es-vaporlens__point-button {
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .es-vaporlens__point-button:hover,
    .es-vaporlens__point-button:focus-visible,
    .es-vaporlens__point-button[aria-expanded="true"] {
        color: #b3dcf7;
        outline: none;
    }

    .es-vaporlens__point-text {
        flex: 1;
        min-width: 0;
        color: inherit;
    }

    .es-vaporlens__importance-badge {
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

    .es-vaporlens__empty {
        padding: 4px 0;
        border-radius: 0;
        background: transparent;
        border: 0;
        color: #8ea4ba;
        font-size: 13px;
        font-style: italic;
        text-align: left;
    }

    .es-vaporlens__popover {
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

    .es-vaporlens__popover p {
        margin: 0;
        font-size: 13px;
        color: #c7d5e0;
        line-height: 1.4;
    }

    @media (max-width: 700px) {
        .es-vaporlens__header {
            flex-direction: column;
            align-items: flex-start;
        }

        .es-vaporlens__cta {
            width: 100%;
            text-align: center;
        }
    }

    @media (max-width: 1100px) {
        .es-vaporlens__sections-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 960px) {
        .es-vaporlens__intro {
            grid-template-columns: minmax(0, 1fr);
        }

        .es-vaporlens__section--summary ul {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    @media (max-width: 640px) {
        .es-vaporlens__sections-grid {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
