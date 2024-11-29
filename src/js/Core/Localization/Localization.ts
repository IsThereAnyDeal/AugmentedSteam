import Settings from "@Options/Data/Settings";
import ExtensionResources from "@Core/ExtensionResources";
import Language from "@Core/Localization/Language";
import SteamStoreApiFacade from "@Content/Modules/Facades/SteamStoreApiFacade";

export interface TLocale {
    stats: {
        strings: number,
        translated: number,
    },
    strings: Record<string, string>
}

export default class Localization {

    public static locale: TLocale;

    static load(code: string): Promise<TLocale> {
        return ExtensionResources.getJSON(`/localization/compiled/${code}.json`);
    }

    static async init(current: Language|null): Promise<void> {
        const stored: string = Settings.language;
        if (current === null) {
            current = new Language(stored);
        } else if (current.name !== stored) {
            Settings.language = current.name;
            SteamStoreApiFacade.clearPurchases(); // TODO this is a nasty side effect, get rid of it
        }

        const lang = current.code ?? "en";

        try {
            this.locale = await this.load(lang);
        } catch(e) {
            console.error(`Failed to load ${lang}`);
            this.locale = await this.load("en");
        }
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
