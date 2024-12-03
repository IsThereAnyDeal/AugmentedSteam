<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import ExtensionResources from "@Core/ExtensionResources";
    import {
        __bugFeature,
        __cancel,
        __clearCache,
        __contribute,
        __launchRandom,
        __ok,
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
    import CacheApiFacade from "@Content/Modules/Facades/CacheApiFacade";
    import {onMount} from "svelte";
    import {fade} from "svelte/transition";
    import ConfirmDialog from "@Core/Modals/ConfirmDialog";
    import {EModalAction} from "@Core/Modals/Contained/EModalAction";

    export let user: UserInterface;

    let isOpen: boolean = false;
    let parentNode: HTMLElement;

    function outsideClickHandler(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (parentNode.contains(target)) {
            return;
        }
        closeMenu();
    }

    function toggleMenu(): void {
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    function openMenu(): void {
        isOpen = true;
        document.addEventListener("click", outsideClickHandler);
    }

    function closeMenu(): void {
        isOpen = false;
        document.removeEventListener("click", outsideClickHandler);
    }

    async function clearCache(): Promise<void> {
        await CacheApiFacade.clearCache();
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

        const confirm = await (new ConfirmDialog(
            L(__playGame, {gamename}),
            `<img src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${gameid}/header.jpg">`,
            {
                primary: L(__ok),
                secondary: L(__visitStore),
                cancel: L(__cancel)
            }
        )).show();

        if (confirm === EModalAction.OK) {
            window.location.assign(`steam://run/${gameid}`)
        } else if (confirm === EModalAction.Secondary) {
            window.location.assign(`//store.steampowered.com/app/${gameid}`)
        }
    }

    onMount(() => {
        parentNode
    });
</script>

<div class="as-menu" bind:this={parentNode}>
    <button class:is-open={isOpen} on:click={toggleMenu}>Augmented Steam</button>

    {#if isOpen}
        <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
        <div class="body" on:click={closeMenu} transition:fade={{duration: 100}}>
            <div class="group">
                <a target="_blank" href={ExtensionResources.getURL("html/options.html")}>{L(__thewordoptions)}</a>
                <a href="#clear_cache" on:click|preventDefault={clearCache}>{L(__clearCache)}</a>
            </div>
            <div class="group">
                <a use:external href="https://github.com/IsThereAnyDeal/AugmentedSteam">{L(__contribute)}</a>
                <a use:external href="https://github.com/IsThereAnyDeal/AugmentedSteam/issues">{L(__bugFeature)}</a>
            </div>
            <div class="group">
                <a use:external href="{Config.PublicHost}">{L(__website)}</a>
                <a use:external href="https://isthereanydeal.com/">IsThereAnyDeal</a>
                <a use:external href="{Config.ITADDiscord}">Discord</a>
            </div>

            {#if user.isSignedIn}
                <div class="group">
                    <a id="es_random_game" class="popup_menu_item" on:click={launchRandom}>{L(__launchRandom)}</a>
                </div>
            {/if}
        </div>
    {/if}
</div>


<style>
    .as-menu {
        display: inline-block;
        position: relative;
    }

    button {
        display: inline-flex;
        align-items: center;
        border: none;
        height: 25px;
        font: inherit;
        line-height: 25px;
        margin-right: 5px;
        color: #b8b6b4;
        background-color: transparent;
        background-image: url("https://cdn.fastly.steamstatic.com/store/ssr/btn_arrow_down_padded-LIJGVCWF.png");
        background-position: right center;
        background-repeat: no-repeat;
        padding-right: 18px;
        cursor: pointer;
    }
    button.is-open,
    button:hover {
        color: #ffffff;
    }

    .body {
        position: absolute;
        right: 0;
        top: 100%;
        white-space: nowrap;
        font-size: 13px;
        color: #b8b6b4;
        padding: 0;
        margin: 0;
        background: #3d4450;
        box-shadow: 0 0 12px #000000;
        z-index: 1000;
    }

    .group + .group {
        border-top: 1px solid #63717e;
    }

    a {
        padding: 8px 18px;
        display: block;
        text-decoration: none;
        color: #dcdedf;
        white-space: nowrap;
        cursor: pointer;
        background: none;
        border: none;
        box-sizing: border-box;
        text-align: start;
        width: 100%;
    }
    a:hover {
        background: #dcdedf;
        color: #171a21;
    }
</style>
