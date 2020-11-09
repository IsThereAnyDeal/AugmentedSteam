import {HTML} from "../../Core/Html/Html";
import {Language} from "../../Core/Localization/Language";
import {Localization} from "../../Core/Localization/Localization";
import LocaleCredits from "./Data/LocaleCredits";

class LocaleCreditsBuilder {

    constructor() {
        this._total = this._deepCount(Localization.str);
    }

    _deepCount(obj) {
        let cnt = 0;
        for (const key of Object.keys(obj)) {
            if (!Localization.str[key]) { // don't count "made up" translations
                continue;
            }
            if (typeof obj[key] === "object") {
                cnt += this._deepCount(obj[key]);
            } else if (obj[key] !== "") {
                cnt++;
            }
        }
        return cnt;
    }

    async _computeCoverage(lang) {
        if (lang === "english") { return 100; }
        const code = Language.languages[lang];
        const locale = await Localization.loadLocalization(code);
        const count = this._deepCount(locale);
        return 100 * count / this._total;
    }

    async build() {

        let html = "";
        for (const [lang, credits] of Object.entries(LocaleCredits)) {

            const coverage = await this._computeCoverage(lang);

            html += `
                <div class="lang js-lang">
                    <h2 class="lang__name">${Localization.str.options.lang[lang]}</h2>
                    <div class="lang__perc js-lang-perc">${coverage.toFixed(1)}%</div>
                    <div class="lang__credits">${credits}</div>
                </div>`;
        }

        HTML.inner(document.querySelector(".js-credits-locale"), html);
    }
}

export {LocaleCreditsBuilder};
