import {BackgroundBase, ExtensionResources, SyncedStorage} from "./core";

import {CookieStorage} from "./content/common.js";

export class Language {
    static getCurrentSteamLanguage() {
        if (this._currentSteamLanguage !== null) {
            return this._currentSteamLanguage;
        }

        const nodes = document.querySelectorAll("script[src]");
        const re = /(?:\?|&(?:amp;)?)l=([^&]+)/;
        for (const n of nodes) {
            const src = n.getAttribute("src");
            const match = src.match(re);
            if (match) {
                this._currentSteamLanguage = match[1];
                return this._currentSteamLanguage;
            }
        }

        // In a Content Context, we can check for a cookie
        if (typeof CookieStorage != "undefined") {
            this._currentSteamLanguage = CookieStorage.get("Steam_Language") || null;
        }

        return this._currentSteamLanguage;
    }

    static getLanguageCode(language) {
        const code = Language.languages[language];
        return code || "en";
    }

    static isCurrentLanguageOneOf(array) {
        return array.includes(Language.getCurrentSteamLanguage());
    }
}
Language._currentSteamLanguage = null;
Language.languages = {
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

export class Localization {
    static loadLocalization(code) {
        return ExtensionResources.getJSON(`/localization/${code}/strings.json`);
    }

    static init() {
        if (Localization._promise) { return Localization._promise; }

        let currentSteamLanguage = Language.getCurrentSteamLanguage();
        let storedSteamLanguage = SyncedStorage.get("language");
        if (currentSteamLanguage === null) {
            currentSteamLanguage = storedSteamLanguage;
        } else if (currentSteamLanguage !== storedSteamLanguage) {
            storedSteamLanguage = currentSteamLanguage;
            SyncedStorage.set("language", currentSteamLanguage);
            BackgroundBase.action("clearpurchases");
        }

        function deepAssign(target, source) {

            // Object.assign() but deep-assigning objects recursively
            for (const [key, val] of Object.entries(source)) {
                if (typeof target[key] === "undefined") {
                    console.warn("The key %s doesn't exist in the English localization file", key);
                    continue;
                }
                if (typeof val === "object") {
                    deepAssign(target[key], val);
                } else if (val !== "") {
                    target[key] = val;
                }
            }
            return target;
        }

        const local = Language.getLanguageCode(currentSteamLanguage);
        const codes = ["en"];
        if (local !== null && local !== "en") {
            codes.push(local);
        }
        Localization._promise = Promise.all(
            codes.map(lc => Localization.loadLocalization(lc))
        ).then(([english, local]) => {
            Localization.str = english;
            if (local) {
                deepAssign(Localization.str, local);
            }
            return Localization.str;
        });
        return Localization._promise;
    }

    static then(onDone, onCatch) {
        return Localization.init().then(onDone, onCatch);
    }

    static getString(key) {

        // Source: http://stackoverflow.com/a/24221895
        const path = key.split(".").reverse();
        let current = Localization.str;

        while (path.length) {
            if (typeof current !== "object") {
                return null;
            }
            current = current[path.pop()];
        }
        return current;
    }
}
Localization._promise = null;
