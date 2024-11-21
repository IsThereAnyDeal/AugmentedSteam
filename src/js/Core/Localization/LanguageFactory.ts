import Language from "@Core/Localization/Language";
import CookieReader from "@Core/Storage/CookieReader";
import type AppConfig from "@Core/AppConfig/AppConfig";

export default class LanguageFactory {

    constructor(
        private readonly config: AppConfig
    ) {}

    createFromLegacy(): Language|null {

        if (this.config.language) {
            return new Language(this.config.language);
        }

        for (const script of document.querySelectorAll<HTMLScriptElement>("script[src]")) {
            const language = new URL(script.src).searchParams.get("l");
            if (language) {
                return new Language(language);
            }
        }

        // last resort, try cookie
        const cookie = CookieReader.get("Steam_Language", null);
        if (cookie) {
            return new Language(cookie);
        }

        return null;
    }

    createFromReact(): Language|null {
        if (this.config.language) {
            return new Language(this.config.language);
        }

        return null;
    }
}