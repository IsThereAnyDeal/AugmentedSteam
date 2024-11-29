<script lang="ts">
    import Settings from "@Options/Data/Settings";
    import {onMount} from "svelte";
    import LoginWarning from "@Content/Modules/Widgets/AugmentedSteam/Components/LoginWarning.svelte";
    import Language from "@Core/Localization/Language";
    import LanguageWarning from "@Content/Modules/Widgets/AugmentedSteam/Components/LanguageWarning.svelte";

    export let language: Language;
    export let react: boolean;

    let languageWarning: Language|null = null;
    let loginWarning: "store"|"community"|null = null;

    onMount(() => {
        document.addEventListener("asRequestError", async (e) => {
            const {detail} = e as CustomEvent;
            const name = detail.name ?? null;
            const message = detail.message ?? null;

            if (name === "LoginError" && (message === "store" || message === "community")) {
                loginWarning = message;
            }
        });

        if (Settings.showlanguagewarning) {
            if (!Settings.showlanguagewarninglanguage) {
                Settings.showlanguagewarninglanguage = language.name;
            }

            const warningLanguage = Settings.showlanguagewarninglanguage;
            if (language.name !== warningLanguage) {
                languageWarning = new Language(warningLanguage);
            }
        }
    });
</script>


{#if languageWarning}
    <LanguageWarning {react}
            currentLanguage={language}
            warningLanguage={languageWarning}
            on:close={() => languageWarning = null}
    />
{/if}

{#if loginWarning}
    <LoginWarning {react}
            page={loginWarning}
            on:close={() => loginWarning = null}
    />
{/if}
