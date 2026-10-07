import Language from "@Core/Localization/Language";
import CookieReader from "@Core/Storage/CookieReader";

export default class LanguageFactory {

    createFromLegacy(language: string|undefined): Language|null {

        if (language) {
            return new Language(language);
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

    createFromReact(language: string|undefined): Language|null {
        if (language) {
            return new Language(language);
        }

        return null;
    }
}