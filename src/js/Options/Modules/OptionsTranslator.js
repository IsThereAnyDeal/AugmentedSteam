import {HTML} from "../../Core/Html/Html";
import {Localization} from "../../Core/Localization/Localization";

class OptionsTranslator {

    static getTranslation(locale) {
        let translation = Localization.getString(locale);
        if (locale.startsWith("options.context_")) {
            translation = translation.replace("__query__", "...");
        }
        if (translation) {
            return translation;
        } else {
            console.warn(`Missing translation ${locale}`);
        }
        return null;
    }

    static _localizeText() {
        const nodes = document.querySelectorAll("[data-locale-text]");
        for (const node of nodes) {
            const translation = this.getTranslation(node.dataset.localeText);
            if (translation) {
                node.text = translation;
            }
        }
    }

    static _localizeHtml() {
        const nodes = document.querySelectorAll("[data-locale-html]");
        for (const node of nodes) {
            const translation = Localization.getString(node.dataset.localeHtml);
            if (translation) {
                HTML.inner(node, translation);
            } else {
                console.warn(`Missing translation ${node.dataset.localeHtml}`);
            }
        }
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
