<script lang="ts" context="module">
    import self_ from "./FDLCInfo.svelte";
    import type CApp from "@Content/Features/Store/App/CApp";
    import Feature from "@Content/Modules/Context/Feature";
    import AugmentedSteamApiFacade from "@Content/Modules/Facades/AugmentedSteamApiFacade";
    import ExtensionResources from "@Core/ExtensionResources";

    export class FDLCInfo extends Feature<CApp> {

        override checkPrerequisites(): boolean {
            return this.context.isDlc;
        }

        override async apply(): Promise<void> {
            let response;

            try {
                response = await AugmentedSteamApiFacade.fetchDlcInfo(this.context.appid);
                // TODO remove when suggestion link is fixed
                if (!response || !response.length) { return; }
            } catch (err) {
                console.error(err);
                return;
            }

            const anchor = document.querySelector("#category_block")!;
            const target = anchor.parentElement!;

            (new self_({
                target,
                anchor,
                props: {
                    dlcInfo: response
                }
            }));
        }
    }
</script>

<script lang="ts">
    import {__dlcDetails} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import type {TDlcInfo} from "@Background/Modules/AugmentedSteam/_types";

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
