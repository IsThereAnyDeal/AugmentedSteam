<script lang="ts">
    import {__thewordoptions} from "@Strings/_strings";
    import {onMount} from "svelte";
    import Header from "./Modules/Header.svelte";
    import Footer from "./Modules/Footer.svelte";
    import Localization, {L} from "@Core/Localization/Localization";
    import {SettingsStore} from "./Data/Settings";
    import "./options.css";
    import Changelog from "./Modules/Changelog/Changelog.svelte";
    import About from "./Modules/About/About.svelte";
    import Sidebar from "./Modules/Sidebar.svelte";
    import GeneralOptions from "./Modules/Options/GeneralOptions.svelte";
    import StoreOptions from "./Modules/Options/StoreOptions.svelte";
    import CommunityOptions from "./Modules/Options/CommunityOptions.svelte";
    import PriceOptions from "./Modules/Options/PriceOptions.svelte";
    import ITADOptions from "./Modules/Options/ITADOptions.svelte";
    import AppPageOptions from "./Modules/Options/AppPageOptions.svelte";

    let initialLoad: Promise<void>|null = null;

    onMount(() => {
        initialLoad = (async () => {
            await SettingsStore.init();
            await Localization.init(null);
        })();
    });

    export let section: string = (window.location.hash === "")
        ? "general"
        : window.location.hash.substring(1);
</script>


<svelte:head>
    {#if initialLoad}
        {#await initialLoad then _}
            <title>Augmented Steam {L(__thewordoptions)}</title>
        {/await}
    {/if}
</svelte:head>


<Header />

{#if initialLoad}
    {#await initialLoad then _}
        <div class="page">
            <Sidebar bind:selected={section} />

            <div>
                {#if section === "general"}
                    <GeneralOptions />
                {:else if section === "itad"}
                    <ITADOptions />
                {:else if section === "store"}
                    <StoreOptions />
                {:else if section === "app"}
                    <AppPageOptions />
                {:else if section === "price"}
                    <PriceOptions />
                {:else if section === "community"}
                    <CommunityOptions />
                {:else if section === "changelog"}
                    <Changelog />
                {:else if section === "about"}
                    <About />
                {/if}
            </div>
        </div>

        <Footer />
    {/await}
{/if}


<style>
    .page {
        position: relative;
        width: 935px;
        display: grid;
        grid-template-columns: 220px 700px;
        gap: 15px;
        align-items: flex-start;
        min-height: 100vh;
        margin: auto;
        font-size: var(--text-size);
        padding-bottom: 200px;
    }
</style>
