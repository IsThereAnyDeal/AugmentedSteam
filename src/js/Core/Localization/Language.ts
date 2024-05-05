import ApplicationConfig from "../../Content/Modules/ApplicationConfig";
import {CookieStorage} from "../Storage/CookieStorage";
import Environment from "@Core/Environment";

export default class Language {

    private static _currentSteamLanguage: string|null = null;

    public static map: Record<string, string> ={
        "english": "en",
        "bulgarian": "bg",
        "czech": "cs",
        "danish": "da",
        "dutch": "nl",
        "finnish": "fi",
        "french": "fr",
        "greek": "el",
        "german": "de",
        "hungarian": "hu",
        "italian": "it",
        "japanese": "ja",
        "koreana": "ko",
        "norwegian": "no",
        "polish": "pl",
        "portuguese": "pt-PT",
        "brazilian": "pt-BR",
        "russian": "ru",
        "romanian": "ro",
        "schinese": "zh-CN",
        "spanish": "es-ES",
        "latam": "es-419",
        "swedish": "sv-SE",
        "tchinese": "zh-TW",
        "thai": "th",
        "turkish": "tr",
        "ukrainian": "ua",
        "vietnamese": "vi",
    };

    static getCurrentSteamLanguage() {
        if (this._currentSteamLanguage !== null) {
            return this._currentSteamLanguage;
        }

        try {
            this._currentSteamLanguage = ApplicationConfig.language();
            return this._currentSteamLanguage;
        } catch(e) {
            // no handling
        }

        for (const script of document.querySelectorAll<HTMLScriptElement>("script[src]")) {
            const language = new URL(script.src).searchParams.get("l");
            if (language) {
                Language._currentSteamLanguage = language;
                return this._currentSteamLanguage;
            }
        }

        // In a Content Context, we can check for a cookie
        if (Environment.isContentScript()) {
            Language._currentSteamLanguage = CookieStorage.get("Steam_Language") || null;
        }

        return this._currentSteamLanguage;
    }

    static getLanguageCode(language: string): string {
        return this.map[language] ?? "en";
    }

    static isCurrentLanguageOneOf(...languages: string[]) {
        return languages.includes(this.getCurrentSteamLanguage() ?? "");
    }
}

