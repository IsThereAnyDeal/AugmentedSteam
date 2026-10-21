<script lang="ts">
    import {__downloadDemoHeader, __export_download} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {onMount} from "svelte";

    interface Props {
        appName: string,
        windows: boolean,
        mac: boolean,
        linux: boolean,
        demoLink: string,
    }

    let { appName, windows, mac, linux, demoLink }: Props = $props();

    let buttonNode: HTMLElement;

    onMount(() => {
        // Prevent sanitizing inline javascript (comes from page, safe source)
        buttonNode.setAttribute("onclick", demoLink);
    });
</script>


<!-- TODO replace Steam styles to prevent inevitable breakage -->

<div class="game_area_purchase_game demo_above_purchase">
    <div class="game_area_purchase_platform">
        {#if windows}
            <span class="platform_img win"></span>
        {/if}

        {#if mac}
            <span class="platform_img mac"></span>
        {/if}

        {#if linux}
            <span class="platform_img linux"></span>
        {/if}
    </div>
    <h1>{L(__downloadDemoHeader, {"gamename": appName})}</h1>
    <div class="game_purchase_action">
        <div class="game_purchase_action_bg">
            <div id="demoGameBtn" class="btn_addtocart" bind:this={buttonNode}>
                <span class="btn_green_steamui btn_medium">
                    <span>{L(__export_download)}</span>
                </span>
            </div>
        </div>
    </div>
</div>
