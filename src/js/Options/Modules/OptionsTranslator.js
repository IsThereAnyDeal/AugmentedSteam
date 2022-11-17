import {HTML} from "../../Core/Html/Html";
import {Localization} from "../../Core/Localization/Localization";
import Config from "../../config";

class OptionsTranslator {

    static getTranslation(key) {
        let translation = Localization.getString(key);
        if (!translation) {
            console.error("Missing translation for %s", key);
            return null;
        }
        if (key.startsWith("options.context_")) {
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
        const optionsStr = Localization.str.options;

        // HTML tags are not allowed in localization strings
        let html = optionsStr.with_help_of
            .replace("__contributors__", `<a href="https://github.com/IsThereAnyDeal/AugmentedSteam/graphs/contributors">${optionsStr.contributors}</a>`);
        HTML.inner(".js-contributors-text", html);

        html = optionsStr.about_desc_links
            .replace("__website__", `<a href="${Config.PublicHost}">${Localization.str.website.toLowerCase()}</a>`)
            .replace("__discord__", `<a href="${Config.ITADDiscord}">Discord</a>`);
        HTML.inner(".js-about-text", html);
    }

    static _localizeLanguageOptions() {
        const nodes = document.querySelectorAll("#warning_language option");
        for (const node of nodes) {
            const lang = node.textContent;
            const langTrl = Localization.str.options.lang[node.value.toLowerCase()];
            if (lang !== langTrl) {
                node.textContent = `${lang} (${langTrl})`;
            }
        }
    }

    static translate() {
        document.title = `Augmented Steam ${Localization.str.thewordoptions}`;

        this._localizeText();
        this._localizeHtml();
        this._localizeLanguageOptions();
    }
}

export {OptionsTranslator};
