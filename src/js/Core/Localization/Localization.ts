import Settings from "@Options/Data/Settings";
import ExtensionResources from "@Core/ExtensionResources";
import Language from "@Core/Localization/Language";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";

interface TLocale {
    stats: {
        strings: number,
        translated: number,
    },
    strings: Record<string, string>
}

export default class Localization {

    private static promise: Promise<void>;
    public static locale: TLocale;

    static load(code: string): Promise<TLocale> {
        return ExtensionResources.getJSON(`/localization/compiled/${code}.json`);
    }

    static init(): Promise<void> {
        if (!this.promise) {
            this.promise = (async () => {
                const stored = Settings.language;
                let current = Language.getCurrentSteamLanguage();
                if (current === null) {
                    current = stored;
                } else if (current !== stored) {
                    Settings.language = current;
                    SteamStoreApiFacade.clearPurchases();
                }

                const lang = Language.getLanguageCode(current);

                try {
                    this.locale = await this.load(lang);
                } catch(e) {
                    console.error(`Failed to load ${lang}`);
                    this.locale = await this.load("en");
                }
            })();
        }

        return this.promise;
    }
}

export function L(key: string, replacements: Record<string, string|number>|null = null): string {
    let text = Localization.locale.strings[key] ?? "<<missing text>>";
    if (replacements !== null) {
        for (let [key, value] of Object.entries(replacements)) {
            text = text.replaceAll(`__${key}__`, String(value));
        }
    }
    return text;
}
