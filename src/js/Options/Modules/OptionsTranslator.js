import {
    __options_aboutDescLinks,
    __options_contributors,
    __options_withHelpOf, __thewordoptions,
    __website,
} from "../../../localization/compiled/_strings";
import {HTML} from "../../Core/Html/Html";
import Config from "../../config";
import {L} from "../../Core/Localization/Localization";

class OptionsTranslator {

    static getTranslation(key) {
        let translation = L(key);
        if (key.startsWith("options_context")) {
            // TODO why is this not in query string directly?
            translation = translation.replace("__query__", "...");
        }
        return translation;
    }

    static _localizeText() {
        const nodes = document.querySelectorAll("[data-locale-text]");
        for (const node of nodes) {
            const translation = this.getTranslation(node.dataset.localeText);
            if (translation) {
                node.textContent = translation;
            }
        }
    }

    static _localizeHtml() {

        // HTML tags are not allowed in localization strings
        let html = L(__options_withHelpOf, {
            "contributors": `<a href="https://github.com/IsThereAnyDeal/AugmentedSteam/graphs/contributors">${L(__options_contributors)}</a>`
        });
        HTML.inner(".js-contributors-text", html);

        html = L(__options_aboutDescLinks, {
            "website": `<a href="${Config.PublicHost}">${L(__website).toLowerCase()}</a>`,
            "discord": `<a href="${Config.ITADDiscord}">Discord</a>`
        });
        HTML.inner(".js-about-text", html);
    }

    static _localizeLanguageOptions() {
        const nodes = document.querySelectorAll("#warning_language option");
        for (const node of nodes) {
            const lang = node.textContent;
            const langTrl = L(`options_lang_${node.value.toLowerCase()}`);
            if (lang !== langTrl) {
                node.textContent = `${lang} (${langTrl})`;
            }
        }
    }

    static translate() {
        document.title = `Augmented Steam ${L(__thewordoptions)}`;

        this._localizeText();
        this._localizeHtml();
        this._localizeLanguageOptions();
    }
}

export {OptionsTranslator};
