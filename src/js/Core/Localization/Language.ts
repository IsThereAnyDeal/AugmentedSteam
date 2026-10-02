
export default class Language {

    public static readonly map: Record<string, string> ={
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

    public static readonly localeMap: Record<string, string> = {
        ...Language.map,
        "thai": "th-TH-u-ca-gregory",
        "ukrainian": "uk",
    };

    private readonly _name: string;
    private readonly _code: string|null;
    private readonly _locale: string|null;

    constructor(language: string) {
        this._name = language;
        this._code = Language.map[language] ?? null;
        this._locale = Language.localeMap[language] ?? this._code;
        // TODO should we throw when there is unsupported language?
    }

    get name(): string {
        return this._name;
    }

    get code(): string|null {
        return this._code;
    }

    get locale(): string|null {
        return this._locale;
    }

    isOneOf(...languages: string[]) {
        return languages.includes(this._name);
    }
}
