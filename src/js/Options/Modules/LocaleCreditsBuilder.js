import {HTML} from "../../Core/Html/Html";
import Language from "../../Core/Localization/Language";
import {L} from "../../Core/Localization/Localization";
import {Localization} from "../../modulesCore";
import LocaleCredits from "./Data/LocaleCredits";

class LocaleCreditsBuilder {

    async _computeCoverage(lang) {
        if (lang === "english") { return 100; }
        const code = Language.map[lang];
        const locale = await Localization.load(code);
        return 100 * locale.stats.translated / locale.stats.strings;
    }

    async build() {

        let html = "";
        for (const [lang, credits] of Object.entries(LocaleCredits)) {

            const coverage = await this._computeCoverage(lang);

            html += `
                <div class="lang js-lang">
                    <h2 class="lang__name">${L(`options_lang_${lang}`)}</h2>
                    <div class="lang__perc js-lang-perc">${coverage.toFixed(1)}%</div>
                    <div class="lang__credits">${credits}</div>
                </div>`;
        }

        HTML.inner(document.querySelector(".js-credits-locale"), html);
    }
}

export {LocaleCreditsBuilder};
