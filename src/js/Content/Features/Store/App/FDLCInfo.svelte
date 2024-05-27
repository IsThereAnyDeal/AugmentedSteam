<script lang="ts">
    import {__dlcDetails} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import type {TDlcInfo} from "@Background/Modules/AugmentedSteam/_types";
    import ExtensionResources from "@Core/ExtensionResources";

    export let dlcInfo: TDlcInfo;
</script>

<div class="block responsive_apppage_details_right heading">{L(__dlcDetails)}</div>
<div class="block es_dlc_info">
    <div class="block_content">
        <div class="block_content_inner">
            <div class="details_block">`;

                {#each dlcInfo as item}
                    <div class="game_area_details_specs">
                        <div class="icon">
                            <img src={ExtensionResources.getURL(`/img/dlcicons/${encodeURIComponent(item.icon)}`)} alt="">
                        </div>
                        <!-- svelte-ignore a11y-missing-attribute -->
                        <a class="name" title={item.description}>{item.name}</a>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
