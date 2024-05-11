<script lang="ts">
    import Localization, {L} from "@Core/Localization/Localization";
    import {__loginWarning, __usingLanguage, __usingLanguageReturn} from "@Strings/_strings";
    import Settings from "@Options/Data/Settings";
    import Warning from "@Content/Modules/Widgets/Components/Warning.svelte";
    import LocalStorage from "@Core/Storage/LocalStorage";
    import SteamFacade from "@Content/Modules/Facades/SteamFacade";
    import Language from "@Core/Localization/Language";

    let showLanguage: boolean = false;
    let showLogin: boolean = false;

    let warningLanguage: string;
    let usingLanguageLocale: string;
    let usingLanguageReturnLocale: string;

    let page: string;
    let host: string;

    export async function showLanguageWarning(currentLanguage: string, warningLanguage_: string): Promise<void> {
        warningLanguage = warningLanguage_;

        let locale = await Localization.load(Language.getLanguageCode(warningLanguage));
        const strings = locale.strings;

        usingLanguageLocale = strings[__usingLanguage]!
            .replace("__current__", strings[`options_lang_${currentLanguage}`] ?? currentLanguage);

        usingLanguageReturnLocale = strings[__usingLanguageReturn]!
            .replace("__base__", strings[`options_lang_${warningLanguage}`] ?? warningLanguage);
    }

    function resetLanguageCode(): void {
        SteamFacade.changeLanguage(warningLanguage, true);
    }

    function closeLanguageWarning() {
        Settings.showlanguagewarning = false;
        showLanguage = false;
    }

    export function showLoginWarning(type: "store"|"community") {
        page = type;

        if (type === "store") {
            host = "store.steampowered.com";
        } else if (type === "community") {
            host = "steamcommunity.com";
        } else {
            throw new Error();
        }

        console.warn("Are you logged into %s?", host);
        showLogin = true;
    }

    function closeLoginWarning() {
        if (page === "store") {
            LocalStorage.set(`hide_login_warn_store`, true);
        } else if (page === "community") {
            LocalStorage.set(`hide_login_warn_community`, true);
        }
        showLogin = false;
    }
</script>


{#if showLanguage}
    <Warning on:close={closeLanguageWarning} on:hide={() => showLanguage = false}>
        {usingLanguageLocale}
        <button type="button" id="es_reset_language_code" on:click|preventDefault={resetLanguageCode}>
            {usingLanguageReturnLocale}
        </button>
    </Warning>
{/if}

{#if showLogin}
    <Warning on:close={closeLoginWarning} on:hide={() => showLogin = false}>
        {@html L(__loginWarning, {"link": `<a href="https://${host}/login/">${host}</a>`})}
    </Warning>
{/if}

