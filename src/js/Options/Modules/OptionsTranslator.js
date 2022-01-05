import {HTML} from "../../Core/Html/Html";
import {Localization} from "../../Core/Localization/Localization";

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
        const nodes = document.querySelectorAll("[data-locale-html]");
        for (const node of nodes) {
            const translation = this.getTranslation(node.dataset.localeHtml);
            if (translation) {
                HTML.inner(node, translation);
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

        // this is not very clean, but I can't figure out better solution right now, having it in-place would be nicer
        const url = "https://github.com/IsThereAnyDeal/AugmentedSteam/graphs/contributors";
        HTML.inner(
            document.querySelector(".js-contributors-text"),
            Localization.getString("options.with_help_of")
                .replace(
                    "__contributors__",
                    `<a href='${url}'>${Localization.getString("options.contributors")}</a>`
                )
        );
    }
}

export {OptionsTranslator};
