<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {
        __ratingDetails,
        __wsgf_certifications,
        __wsgf_gold,
        __wsgf_incomplete,
        __wsgf_limited,
        __wsgf_silver,
        __wsgf_unsupported,
    } from "@Strings/_strings";
    import ExtensionResources from "@Core/ExtensionResources";
    import SidebarBox from "@Content/Features/Store/App/Components/SidebarBox.svelte";

    interface Props {
        url: string,
        wsg: string,
        mmg: string,
        fkg: string,
        uws: string
    }

    let {url, wsg, mmg, fkg, uws}: Props = $props();

    const levelMap = {
        "A": ["gold", __wsgf_gold],
        "B": ["silver", __wsgf_silver],
        "C": ["limited", __wsgf_limited],
        "Incomplete": ["incomplete", __wsgf_incomplete],
        "Unsupported": ["unsupported", __wsgf_unsupported]
    };
</script>


{#snippet rating(value: string, imgPrefix: string, typeName: string)}
    {@const [level, string] = levelMap[value] ?? [null, null]}

    {#if level}
        {@const title = L(string, {type: typeName})}
        <div>
            <img src={ExtensionResources.getURL(`img/wsgf/${imgPrefix}-${level}.png`)} {title} alt={title} />
        </div>
    {/if}
{/snippet}

<SidebarBox title={L(__wsgf_certifications)}>
    <div class="details_block">
        {@render rating(wsg, "ws", "Widescreen")}
        {@render rating(mmg, "mm", "Multi-Monitor")}
        {@render rating(uws, "uw", "Ultra-Widescreen")}
        {@render rating(fkg, "4k", "4k UHD")}
    </div>
    <a class="linkbar es_external_icon" target="_blank" href={url}>{L(__ratingDetails)}</a>
</SidebarBox>


<style>
    .details_block {
        margin-top: -10px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;

    }
    img {
        border: 0;
        cursor: help;
        width: 100%;
    }
</style>