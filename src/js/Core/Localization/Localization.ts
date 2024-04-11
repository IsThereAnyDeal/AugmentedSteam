import {BackgroundSimple, ExtensionResources, Language, SyncedStorage} from "../../modulesCore";

interface TLocale {
    stats: {
        strings: number,
        translated: number,
    },
    strings: Record<string, string>
}

export default class Localization {

    private static _promise: Promise<void>|null = null;
    public static locale: TLocale;

    static load(code: string): Promise<TLocale> {
        return ExtensionResources.getJSON(`/localization/compiled/${code}.json`);
    }

    static init() {
        if (!this._promise) {
            this._promise = (async () => {
                const stored = SyncedStorage.get("language");
                let current = Language.getCurrentSteamLanguage();
                if (current === null) {
                    current = stored;
                } else if (current !== stored) {
                    SyncedStorage.set("language", current);
                    BackgroundSimple.action("clearpurchases");
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

        return this._promise;
    }

    static then(
        onfulfilled: ((value: void) => Promise<void>) | undefined | null,
        onrejected: ((reason: any) => Promise<void>) | undefined | null
    ): Promise<void> {
        return Localization.init().then(onfulfilled, onrejected);
    }
}

export function L(key: string): string | undefined {
    return Localization.locale.strings[key] ?? undefined;
}
