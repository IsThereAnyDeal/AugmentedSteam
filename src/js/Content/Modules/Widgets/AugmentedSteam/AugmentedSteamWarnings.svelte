<script lang="ts">
    import Settings from "@Options/Data/Settings";
    import {onMount} from "svelte";
    import LoginWarning from "@Content/Modules/Widgets/AugmentedSteam/Components/LoginWarning.svelte";
    import Language from "@Core/Localization/Language";
    import LanguageWarning from "@Content/Modules/Widgets/AugmentedSteam/Components/LanguageWarning.svelte";
    import LocalStorage from "@Core/Storage/LocalStorage";

    interface Props {
        language: Language;
        react: boolean;
    }

    let { language, react }: Props = $props();

    let languageWarning: Language|null = $state(null);
    let loginWarning: "store"|"community"|null = $state(null);

    onMount(() => {
        document.addEventListener("asRequestError", async (e) => {
            const {detail} = e as CustomEvent;
            const name = detail.name ?? null;
            const message = detail.message ?? null;

            if (name === "LoginError" &&
                (
                    (message === "store" && await LocalStorage.get("hide_login_warn_store") !== true)
                    || (message === "community" && await LocalStorage.get("hide_login_warn_community") !== true)
                ))
            {
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
            onclose={() => languageWarning = null}
    />
{/if}

{#if loginWarning}
    <LoginWarning {react}
            page={loginWarning}
            onclose={() => loginWarning = null}
    />
{/if}
