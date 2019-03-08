class Language {
    static getCurrentSteamLanguage() {
        if (this._currentSteamLanguage != null) {
            return this._currentSteamLanguage;
        }

        let nodes = document.querySelectorAll("script[src]");
        let re = /(?:\?|&(?:amp;)?)l=([^&]+)/;
        for (let n of nodes) {
            let src = n.getAttribute("src");
            let match = src.match(re);
            if (match) {
                this._currentSteamLanguage = match[1];
                return this._currentSteamLanguage;
            }
        }

        // In a Content Context, we can check for a cookie
        if (typeof CookieStorage != 'undefined') {
            this._currentSteamLanguage = CookieStorage.get("Steam_Language") || null;
        }

        return this._currentSteamLanguage;
    }

    static getLanguageCode(language) {
        let code = Language.languages[language];
        return code ? code.toLowerCase() : "en";
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
};

  
class Localization {
    static loadLocalization(code) {
        return ExtensionResources.getJSON(`/localization/${code}/strings.json`);
    }

    static init() {
        if (Localization._promise) { return Localization._promise; }

        let currentSteamLanguage = Language.getCurrentSteamLanguage();
        let storedSteamLanguage = SyncedStorage.get("language");
        if (currentSteamLanguage === null) {
            currentSteamLanguage = storedSteamLanguage;
        } else {
            if (currentSteamLanguage !== storedSteamLanguage) {
                storedSteamLanguage = currentSteamLanguage;
                SyncedStorage.set("language", currentSteamLanguage);
            }
        }

        function deepAssign(target, source) {
            // Object.assign() but deep-assigning objects recursively
            for (let [key, val] in source) {
                if (typeof val === "object") {
                    deepAssign(target[key], val);
                } else {
                    target[key] = val;
                }
            }
            return target;
        }

        let local = Language.getLanguageCode(currentSteamLanguage);
        let codes = ["en",];
        if (local !== null && local !== "en") {
            codes.push(local);
        }
        Localization._promise = Promise.all(
            codes.map(lc => Localization.loadLocalization(lc))
        ).then(function([english, local]) {
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
        let path = key.split('.').reverse();
        let current = Localization.str;

        while (path.length) {
            if (typeof current !== 'object') {
                return undefined;
            } else {
                current = current[path.pop()];
            }
        }
        return current;
    }
}
Localization._promise = null;
