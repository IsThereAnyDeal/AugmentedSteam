<script lang="ts">
    import SteamFacade from "@Content/Modules/Facades/SteamFacade";
    import AugmentedSteam from "@Content/Modules/AugmentedSteam";
    import {L} from "@Core/Localization/Localization";
    import ExtensionResources from "@Core/ExtensionResources";
    import {
        __bugFeature,
        __clearCache,
        __contribute,
        __launchRandom,
        __playGame,
        __thewordoptions,
        __visitStore,
        __website
    } from "@Strings/_strings";
    import Config from "config";
    import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";
    import DynamicStore from "@Content/Modules/Data/DynamicStore";
    import external from "@Content/externalLink";
    import type UserInterface from "@Core/User/UserInterface";

    export let user: UserInterface;

    const isSignedIn = user.isSignedIn;

    function showMenu() {
        SteamFacade.showMenu("es_pulldown", "es_popup", "right", "bottom", true);
    }

    function hideMenu() {
        SteamFacade.hideMenu("es_pulldown", "es_popup");
    }

    async function clearCache() {
        await AugmentedSteam.clearCache();
        window.location.reload();
    }

    async function launchRandom(): Promise<void> {
        const appid = await DynamicStore.getRandomApp();
        if (!appid) { return; }

        const appdetails = await SteamStoreApiFacade.fetchAppDetails(appid);
        if (!appdetails) {
            return;
        }

        const gameid = appdetails.fullgame?.appid ?? appid;
        const gamename = appdetails.fullgame?.name ?? appdetails.name;

        const confirm = await SteamFacade.showConfirmDialog(
            L(__playGame, {gamename}),
            `<img src="//shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${gameid}/header.jpg">`,
            {
                secondaryActionButton: L(__visitStore)
            }
        );
        if (confirm === "OK") {
            window.location.assign(`steam://run/${gameid}`)
        } else if (confirm === "SECONDARY") {
            window.location.assign(`//store.steampowered.com/app/${gameid}`)
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<span id="es_pulldown" class="pulldown global_action_link" on:click={showMenu}>Augmented Steam</span>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div id="es_popup" class="popup_block_new" on:click={hideMenu}>
    <div class="popup_body popup_menu">
        <a class="popup_menu_item" target="_blank" href={ExtensionResources.getURL("html/options.html")}>{L(__thewordoptions)}</a>
        <a class="popup_menu_item" id="es_clear_cache" href="#clear_cache" on:click|preventDefault={clearCache}>{L(__clearCache)}</a>
        <div class="hr"></div>
        <a class="popup_menu_item" use:external href="https://github.com/IsThereAnyDeal/AugmentedSteam">{L(__contribute)}</a>
        <a class="popup_menu_item" use:external href="https://github.com/IsThereAnyDeal/AugmentedSteam/issues">{L(__bugFeature)}</a>
        <div class="hr"></div>
        <a class="popup_menu_item" use:external href="{Config.PublicHost}">{L(__website)}</a>
        <a class="popup_menu_item" use:external href="https://isthereanydeal.com/">IsThereAnyDeal</a>
        <a class="popup_menu_item" use:external href="{Config.ITADDiscord}">Discord</a>

        {#if isSignedIn}
            <div class="hr">
            </div><a id="es_random_game" class="popup_menu_item" on:click={launchRandom}>{L(__launchRandom)}</a>
        {/if}
    </div>
</div>


<style>
    #es_pulldown {
        display: inline-block;
        padding-left: 4px;
        line-height: 25px;
    }
    #es_pulldown:global(.focus) {
        color: #ffffff;
    }
    #es_popup {
        display: none;
    }
    #es_popup > .popup_body {
        width: fit-content;
        max-width: 250px;
    }
    #es_popup > .popup_body.popup_menu .popup_menu_item {
        padding: 8px 18px;
        font-size: 13px;
    }
    #es_popup > .popup_body.popup_menu .hr {
        margin: 2px 12px;
    }
</style>
