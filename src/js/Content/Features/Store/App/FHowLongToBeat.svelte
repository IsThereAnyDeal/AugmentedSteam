<script lang="ts">
    import {
        __hltb_compl,
        __hltb_main,
        __hltb_mainE,
        __hltb_title,
        __hoursShort,
        __moreInformation
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import external from "@Content/externalLink";
    import SidebarBox from "@Content/Features/Store/App/Components/SidebarBox.svelte";

    function hrs(minutes: number): string {
        return L(__hoursShort, {"hours": (minutes / 60).toFixed(1).toString()});
    }

    interface Props {
        story: number|null;
        extras: number|null;
        complete: number|null;
        url: string;
    }

    let {
        story,
        extras,
        complete,
        url
    }: Props = $props();
</script>


<SidebarBox title={L(__hltb_title)}>
    <div class="container">
        {#if story || extras || complete}
            <ul>
                {#if story}
                    <li>
                        <div>{hrs(story)}</div>
                        {L(__hltb_main)}
                    </li>
                {/if}
                {#if extras}
                    <li>
                        <div>{hrs(extras)}</div>
                        {L(__hltb_mainE)}
                    </li>
                {/if}
                {#if complete}
                    <li>
                        <div>{hrs(complete)}</div>
                        {L(__hltb_compl)}
                    </li>
                {/if}
            </ul>
        {/if}
        <a class="linkbar es_external_icon" href={url} use:external>{L(__moreInformation)}</a>
    </div>
</SidebarBox>


<style>
    .container {
        color: #8f98a0;
    }

    ul {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 10px;
    }

    li {
        list-style-type: none;
        text-align: center;
        line-height: 1.2;
        text-transform: uppercase;
        font-size: 11px;
        color: var(--summary-title-text-color, #798a95);

        & div {
            text-transform: lowercase;
            font-size: 20px;
            color: #c6d4df;
        }
    }
</style>
