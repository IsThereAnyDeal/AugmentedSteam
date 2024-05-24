<script lang="ts" context="module">
    import self_ from "./FHowLongToBeat.svelte";
    import type CApp from "@Content/Features/Store/App/CApp";
    import Feature from "@Content/Modules/Context/Feature";
    import type {TStorePageData} from "@Background/Modules/AugmentedSteam/_types";
    import {__hoursShort} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Settings from "@Options/Data/Settings";

    export class FHowLongToBeat extends Feature<CApp> {

        private hltb: TStorePageData['hltb']|null = null;

        override async checkPrerequisites(): Promise<boolean> {
            if (!Settings.showhltb || this.context.isDlcLike || this.context.isVideoOrHardware) {
                return false;
            }

            const result = await this.context.data;
            if (!result || !result.hltb) {
                return false;
            }

            this.hltb = result.hltb;
            return true;
        }

        apply() {
            if (!this.hltb) { return }

            const anchor = document.querySelector("div.game_details")!.nextElementSibling!;
            new self_({
                target: anchor.parentElement!,
                anchor,
                props: {
                    story: this.hltb.story,
                    extras: this.hltb.extras,
                    complete: this.hltb.complete,
                    url: this.hltb.url
                }
            })
        }
    }
</script>

<script lang="ts">
    import {__hltb_compl, __hltb_main, __hltb_mainE, __hltb_title, __moreInformation} from "@Strings/_strings";

    function hrs(minutes: number): string {
        return L(__hoursShort, {"hours": (minutes / 60).toFixed(1).toString()});
    }

    export let story: number|null;
    export let extras: number|null;
    export let complete: number|null;
    export let url: string;
</script>

<div class="block responsive_apppage_details_right heading">{L(__hltb_title)}</div>
<div class="block underlined_links es_hltb">
    <div class="block_content">
        <div class="block_content_inner">
            {#if story || extras || complete}
                <div class="details_block">
                    {#if story}
                        <b>{L(__hltb_main)}:</b><span>{hrs(story)}</span><br>
                    {/if}
                    {#if extras}
                        <b>{L(__hltb_mainE)}:</b><span>{hrs(extras)}</span><br>
                    {/if}
                    {#if complete}
                        <b>{L(__hltb_compl)}:</b><span>{hrs(complete)}</span><br>
                    {/if}
                </div>
                <br>
            {/if}
            <a class="linkbar es_external_icon" href={url} target="_blank">{L(__moreInformation)}</a>
        </div>
    </div>
</div>


<style>
    .es_hltb {
        color: #8f98a0;
        line-height: 20px;
    }

    .es_hltb b {
        font-family: Arial, Helvetica, sans-serif;
        color: #556772;
        font-weight: normal;
        text-transform: uppercase;
        font-size: 10px;
    }

    .es_hltb span {
        float: right;
    }
</style>
