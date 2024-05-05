<script lang="ts">
    import {
        __about,
        __acknowledgements,
        __helpTranslate,
        __options_aboutDesc,
        __options_aboutDescLinks,
        __options_contributors,
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
        __options_maintainers,
        __options_withHelpOf,
        __originalAuthors,
        __thewordunknown,
        __translation,
        __viewAll,
        __website,
    } from "@Strings/_strings";
    import Language from "@Core/Localization/Language";
    import LocaleCredits from "./LocaleCredits";
    import Localization, {L} from "@Core/Localization/Localization";
    import DOMPurify from "dompurify";
    import Config from "../../../config";

    const localeMap: Record<string, string> = {
        "english": __options_lang_english,
        "bulgarian": __options_lang_bulgarian,
        "czech": __options_lang_czech,
        "danish": __options_lang_danish,
        "dutch": __options_lang_dutch,
        "finnish": __options_lang_finnish,
        "french": __options_lang_french,
        "greek": __options_lang_greek,
        "german": __options_lang_german,
        "hungarian": __options_lang_hungarian,
        "italian": __options_lang_italian,
        "japanese": __options_lang_japanese,
        "koreana": __options_lang_koreana,
        "norwegian": __options_lang_norwegian,
        "polish": __options_lang_polish,
        "portuguese": __options_lang_portuguese,
        "brazilian": __options_lang_brazilian,
        "russian": __options_lang_russian,
        "romanian": __options_lang_romanian,
        "schinese": __options_lang_schinese,
        "tchinese": __options_lang_tchinese,
        "spanish": __options_lang_spanish,
        "latam": __options_lang_latam,
        "swedish": __options_lang_swedish,
        "thai": __options_lang_thai,
        "turkish": __options_lang_turkish,
        "ukrainian": __options_lang_ukrainian,
        "vietnamese": __options_lang_vietnamese,
    };

    async function getCoverage(lang: string): Promise<number> {
        if (lang === "english") {
            return 100;
        }
        const code = Language.map[lang]!;
        const locale = await Localization.load(code);
        return 100 * locale.stats.translated / locale.stats.strings;
    }
</script>


<div>
    <div class="section">
        <h1>{L(__about)}</h1>
        <p>{L(__options_aboutDesc)}</p>
        <p>{@html DOMPurify.sanitize(L(__options_aboutDescLinks, {
                "website": `<a href="${Config.PublicHost}">${L(__website).toLowerCase()}</a>`,
                "discord": `<a href="${Config.ITADDiscord}">Discord</a>`
            }))}</p>
    </div>

    <div class="section">
        <h1>{L(__options_maintainers)}</h1>
        <div>
            <a href="https://github.com/tfedor">Tomáš Fedor</a>,
            <a href="https://steamcommunity.com/id/candela97/">Candela97</a>,
            <a href="https://steamcommunity.com/id/makko2305/">MxtOUT</a>,
            {@html DOMPurify.sanitize(L(__options_withHelpOf, {
                "contributors": `<a href="https://github.com/IsThereAnyDeal/AugmentedSteam/graphs/contributors">${L(__options_contributors)}</a>`
            }))}
        </div>
    </div>

    <div class="section">
        <h1 class="translation">{L(__translation)}</h1>
        <a target="blank" href="https://poeditor.com/join/project/yGk0CFH2Uu">{L(__helpTranslate)}</a>

        {#each Object.entries(LocaleCredits) as [lang, credits]}
            <div class="lang">
                <h3 class="lang__name">{L(localeMap[lang] ?? __thewordunknown)}</h3>
                <div class="lang__perc">
                    {#await getCoverage(lang) then coverage}
                        {coverage.toFixed(1)}%
                    {/await}
                </div>
                <div class="lang__credits">{credits}</div>
            </div>
        {/each}
    </div>

    <div class="section">
        <h1>{L(__acknowledgements)}</h1>
        <ul>
            <li>gekkedev <a href="https://github.com/gekkedev/SteamSupportInfoLeaker">SteamSupportInfoLeaker</a></li>
            <li><a href="https://www.svgrepo.com/svg/5133/save">Save SVG Vector</a> is licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></li>
            <li><a href="https://www.flaticon.com/free-icon/linux_121147">Icon</a> made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></li>
            <li><a href="https://fontawesome.com">FontAwesome</a></li>
        </ul>
    </div>

    <div class="section">
        <h1>{L(__originalAuthors)}</h1>
        <ul>
            <li>Jason Shackles <a href="https://steamcommunity.com/profiles/76561198040672342" id="jshackles_steam">jshackles</a></li>
            <li>Dan C. <a href="https://steamcommunity.com/profiles/76561198012785113" id="JoiNNN_steam">JoiNNN</a></li>
            <li>Ben Williams <a href="https://steamcommunity.com/profiles/76561198000198761" id="smashman_steam">smash.mn</a></li>
            <li>
                <div id="view_all">
                    <a href="https://github.com/jshackles/Enhanced_Steam/graphs/contributors">{L(__viewAll)}</a>
                </div>
            </li>
        </ul>
    </div>
</div>


<style>
    .section {
        margin-bottom: 50px;
    }


    ul {
        margin: 0;
        padding: 0;
        line-height: 2;
    }

    li {
        font-size: 1.5rem;
        list-style-type: none;
        margin: 0;
        padding: 0;
    }

    .translation {
        margin-bottom: 0;
    }


    .lang {
        margin-top: 30px;
    }
    .lang__name {
        margin: 0;
    }
    .lang__perc {
        font-size: 0.8em;
        color: var(--sub-color);
        margin-bottom: 5px;
    }
    .lang__credits {
        font-size: 0.9em;
        line-height: 1.25;
    }
</style>
