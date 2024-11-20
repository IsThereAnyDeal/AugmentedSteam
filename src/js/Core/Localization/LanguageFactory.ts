import Language from "@Core/Localization/Language";
import CookieReader from "@Core/Storage/CookieReader";
import type ApplicationConfigInterface from "@Core/AppConfig/ApplicationConfigInterface";

export default class LanguageFactory {

    constructor(
        private readonly config: ApplicationConfigInterface
    ) {}

    createFromLegacy(): Language|null {

        if (this.config.language !== null) {
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
}