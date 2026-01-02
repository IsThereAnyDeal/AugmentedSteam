<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __options_ai_killswitch,
        __options_ai_killswitchInfo,
        __options_ai_title,
        __options_showVaporlensSummary,
    } from "@Strings/_strings";
    import {type Writable, writable} from "svelte/store";
    import Settings from "../../Data/Settings";
    import Section from "./Components/Section.svelte";
    import Toggle from "./Components/Toggle.svelte";
    import type {SettingsSchema} from "../../Data/_types";
    import OptionGroup from "./Components/OptionGroup.svelte";
    import {slide} from "svelte/transition";

    let settings: Writable<SettingsSchema> = writable(Settings);
</script>


<div>
    <Section title={L(__options_ai_title)}>
        <OptionGroup>
            <Toggle bind:value={$settings.ai_enabled}>{L(__options_ai_killswitch)}
                <div class="note">{L(__options_ai_killswitchInfo)}</div>
            </Toggle>
        </OptionGroup>

        {#if $settings.ai_enabled}
            <div class="features" transition:slide={{axis: "y", duration: 400}}>
                <OptionGroup>
                    <div>
                        <Toggle bind:value={$settings.show_vaporlens_summary}>{L(__options_showVaporlensSummary)}</Toggle>

                        <div class="details">
                            <section>
                                <a href="https://vaporlens.app" target="_blank" rel="noopener">VaporLens</a> &bullet; <a href="https://vaporlens.app/about" target="_blank" rel="noopener">FAQ</a>
                            </section>
                            <section>
                                <header>What does it do?</header>
                                <p>Provides review summaries.</p>

                                <p>Games that have VaporLens summary will have a collapsible box added above reviews with short itemized summary.
                                    Summary is split into several categories that VaporLens recognizes with a score that shows how strong a sentiment
                                    for each item is.</p>

                                <p>This is meant as a "Table of contents", not a replacement for reviews. Users are encouraged to read reviews,
                                    which will often contain nuance that can't be expressed in a summary table.</p>
                            </section>

                            <section>
                                <header>How does it use AI/LLM?</header>
                                <p>VaporLens fetches reviews from Steam via API and selects up to 500 reviews using stratified sampling.
                                    Reviews are filtered and the LLM is used to extract statements from the reviews, which are then
                                    summarized into the overview and stored.</p>

                                <p>Games are processed in background, from queue. User sees cached data, no real time LLM request is made
                                    directly on user's behalf.</p>

                                <p>Augmented Steam fetches already pregenerated data. All users see the same summaries.</p>
                            </section>

                            <section>
                                <header>How is privacy handled?</header>
                                <p>VaporLens fetches public reviews via Steam API, and discards them after analysis. Reviews are not stored
                                and not used for any LLM training.</p>
                            </section>

                            <section>
                                <header>What if the VaporLens changes how it uses LLM?</header>
                                <p>If anything above stops being accurate, the inclusion of VaporLens in Augmented Steam will be re-evaluated.</p>
                            </section>
                        </div>
                    </div>
                </OptionGroup>
            </div>
        {/if}
    </Section>
</div>


<style>
    .note {
        color: var(--sub-color);
        font-size: 12px;
    }

    .features {
        border-top: 1px solid #262833;
    }

    .details {
        margin: 10px 0 10px 40px;
        border-radius: 10px;
        overflow: hidden;
    }

    section {
        background: var(--box-color);
        padding: 15px;

        & + section {
            margin-top: 1px;
        }
    }

    header {
        font-size: 16px;
        margin-bottom: 10px;
        color: var(--text-bright);
    }

    p {
        line-height: 1.25;
    }
</style>