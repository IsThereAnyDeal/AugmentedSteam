<script lang="ts">
    import Localization, {type TLocale} from "@Core/Localization/Localization";
    import {__usingLanguage, __usingLanguageReturn} from "@Strings/_strings";
    import {createEventDispatcher, onMount} from "svelte";
    import Warning from "@Content/Modules/Widgets/AugmentedSteam/Components/Warning.svelte";
    import SteamFacade from "@Content/Modules/Facades/SteamFacade";
    import Settings from "@Options/Data/Settings";
    import Language from "@Core/Localization/Language";

    const dispatch = createEventDispatcher<{
        close: void
    }>();

    let promise: Promise<TLocale>;

    export let react: boolean;
    export let currentLanguage: Language;
    export let warningLanguage: Language;

    function resetLanguageCode(): void {
        // TODO find a way to change language for user in React pages
        SteamFacade.changeLanguage(warningLanguage.name, true);
    }

    function handleClose(): void {
        Settings.showlanguagewarning = false;
        dispatch("close");
    }

    async function handleSetLanguage(): Promise<void> {
        const payload = new FormData();
        payload.set("language", warningLanguage.name);

        await fetch("https://store.steampowered.com/account/setlanguage/", {
            method: "POST",
            body: payload
        });
        window.location.href = `?l=${warningLanguage.name}`;
    }

    function str__usingLanguage(loc: TLocale): string {
        return loc.strings[__usingLanguage]!
            .replace("__current__", loc.strings[`options_lang_${currentLanguage.name}`] ?? currentLanguage.name);
    }

    function str__usingLanguageReturn(loc: TLocale): string {
        return loc.strings[__usingLanguageReturn]!
            .replace("__base__", loc.strings[`options_lang_${warningLanguage.name}`] ?? warningLanguage.name);
    }

    onMount(() => {
        promise = Localization.load(warningLanguage.code ?? "en");
    });
</script>


{#if promise}
    {#await promise then locale}
        <Warning {react} on:close={handleClose} on:hide={() => dispatch("close")}>
            {str__usingLanguage(locale)}

            {#if react}
                <button type="button" on:click={handleSetLanguage}>
                    {str__usingLanguageReturn(locale)}
                </button>
            {:else}
                <button type="button" on:click|preventDefault={resetLanguageCode}>
                    {str__usingLanguageReturn(locale)}
                </button>
            {/if}
        </Warning>
    {/await}
{/if}


<style>
    button {
        background: #ffaaaa;
        padding: 3px 10px;
        color: black;
        font-size: 12px;
        border-radius: 1px;
        text-decoration: none;
        cursor: pointer;
        white-space: nowrap;
        border: 0;
        margin-left: 10px;
    }
    button:hover {
        background: #e89a9a;
    }
</style>