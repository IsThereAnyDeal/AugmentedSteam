<svelte:options immutable={false} />

<script lang="ts">
    import Select from "../Components/Select.svelte";
    import type {Writable} from "svelte/store";
    import type {SettingsSchema} from "../../../Data/_types";
    import {onMount} from "svelte";
    import {
        __options_lang_brazilian,
        __options_lang_bulgarian,
        __options_lang_czech,
        __options_lang_danish,
        __options_lang_dutch,
        __options_lang_english,
        __options_lang_finnish,
        __options_lang_french,
        __options_lang_german,
        __options_lang_greek,
        __options_lang_hungarian,
        __options_lang_italian,
        __options_lang_japanese,
        __options_lang_koreana,
        __options_lang_latam,
        __options_lang_norwegian,
        __options_lang_polish,
        __options_lang_portuguese,
        __options_lang_romanian,
        __options_lang_russian,
        __options_lang_schinese,
        __options_lang_spanish,
        __options_lang_swedish,
        __options_lang_tchinese,
        __options_lang_thai,
        __options_lang_turkish,
        __options_lang_ukrainian,
        __options_lang_vietnamese,
        __options_showLanguagewarning
    } from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import Toggle from "../Components/Toggle.svelte";

    const setup: Array<[string, string, string]> = [
        ["english", __options_lang_english, "English"],
        ["bulgarian", __options_lang_bulgarian, "Bulgarian"],
        ["czech", __options_lang_czech, "Czech"],
        ["danish", __options_lang_danish, "Danish"],
        ["dutch", __options_lang_dutch, "Dutch"],
        ["finnish", __options_lang_finnish, "Finnish"],
        ["french", __options_lang_french, "French"],
        ["greek", __options_lang_greek, "Greek"],
        ["german", __options_lang_german, "German"],
        ["hungarian", __options_lang_hungarian, "Hungarian"],
        ["italian", __options_lang_italian, "Italian"],
        ["japanese", __options_lang_japanese, "Japanese"],
        ["koreana", __options_lang_koreana, "Korean"],
        ["norwegian", __options_lang_norwegian, "Norwegian"],
        ["polish", __options_lang_polish, "Polish"],
        ["portuguese", __options_lang_portuguese, "Portuguese"],
        ["brazilian", __options_lang_brazilian, "Portuguese-Brazil"],
        ["russian", __options_lang_russian, "Russian"],
        ["romanian", __options_lang_romanian, "Romanian"],
        ["schinese", __options_lang_schinese, "Simplified Chinese"],
        ["tchinese", __options_lang_tchinese, "Traditional Chinese"],
        ["spanish", __options_lang_spanish, "Spanish"],
        ["latam", __options_lang_latam, "Latin American Spanish"],
        ["swedish", __options_lang_swedish, "Swedish"],
        ["thai", __options_lang_thai, "Thai"],
        ["turkish", __options_lang_turkish, "Turkish"],
        ["ukrainian", __options_lang_ukrainian, "Ukrainian"],
        ["vietnamese", __options_lang_vietnamese, "Vietnamese"],
    ];

    export let settings: Writable<SettingsSchema>;

    let options: Array<[string, string]> = [];

    onMount(() => {
        options = setup.map(([value, locale, english]) => {
            let localized = L(locale);
            return [value, localized !== english ? `${localized} (${english})` : localized];
        });
        options.sort((a, b) => a[1].localeCompare(b[1]));
    });
</script>


<div class="option">
    <div class="toggle">
        <Toggle bind:value={$settings.showlanguagewarning}>{L(__options_showLanguagewarning)}</Toggle>
    </div>
    <Select bind:value={$settings.showlanguagewarninglanguage} {options}/>
</div>


<style>
    .option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }

    .toggle {
        flex-grow: 1;
    }
</style>
