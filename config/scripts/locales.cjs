const createDOMPurify = require("dompurify");
const fs = require("fs");
const chalk = require("chalk");
const axios = require("axios");
const FormData = require("form-data");
const {JSDOM} = require("jsdom");

const window = new JSDOM().window;
const DOMPurify = createDOMPurify(window);

// Disallow all tags, only plain text is allowed for translations
DOMPurify.setConfig({"ALLOWED_TAGS": []});

const Config = {
    "exportUrl": "https://api.poeditor.com/v2/projects/export",
    "apiToken": "8991d8f3eb8072b32b0e664d3a196384",
    "projectId": 319277
};

// code in POE: our file name
const LANGUAGE_MAP = {
    "bg": "bg",
    "cs": "cs",
    "da": "da",
    "de": "de",
    "el": "el",
    "es": "es-ES",
    "es-419": "es-419",
    "fi": "fi",
    "fr": "fr",
    "hu": "hu",
    "it": "it",
    "ja": "ja",
    "ko": "ko",
    "nl": "nl",
    "no": "no",
    "pl": "pl",
    "pt-br": "pt-BR",
    "pt": "pt-PT",
    "ro": "ro",
    "ru": "ru",
    "sv": "sv-SE",
    "th": "th",
    "tr": "tr",
    "uk": "ua",
    "vi": "vi",
    "zh-Hans": "zh-CN",
    "zh-TW": "zh-TW",
};

function checkTranslations(translation, key = "") {
    if (typeof translation === "string") {
        const sanitized = DOMPurify.sanitize(translation);
        if (sanitized !== translation) {
            throw new Error(`translation for ${key} contains tags`);
        }
    } else if (typeof translation === "object" && translation !== null) {
        for (const [k, v] of Object.entries(translation)) {
            checkTranslations(v, `${key}${key ? "." : ""}${k}`);
        }
    } else {
        throw new Error(`unknown translation value: ${translation}`);
    }
}

async function loadLanguage(languageCode) {
    const data = new FormData();
    data.append("api_token", Config.apiToken);
    data.append("id", Config.projectId);
    data.append("language", languageCode);
    data.append("type", "key_value_json");
    data.append("filters", JSON.stringify(["translated", "not_fuzzy"]));

    let result = await axios.post(Config.exportUrl, data, {"headers": data.getHeaders()});
    const response = result.data;

    if (response.response.code !== "200") {
        throw Error;
    }

    const url = response.result.url;
    
    result = await axios.get(url, {"responseType": "stream"});

    function streamToString(stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on("error", (err) => reject(err));
            stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        });
    }

    const rawJSON = await streamToString(result.data);
    const translation = JSON.parse(rawJSON);

    checkTranslations(translation);

    const filepath = `${__dirname}/../../src/localization/${LANGUAGE_MAP[languageCode]}.json`;
    fs.writeFileSync(filepath, rawJSON);
    
    return filepath;
}

(async() => {
    for (const languageCode of Object.keys(LANGUAGE_MAP)) {
        try {
            const path = await loadLanguage(languageCode);
            console.log(`${chalk.green("OK")} ${languageCode}: ${path}`);
        } catch (e) {
            console.error(`${chalk.red("ERROR")} ${languageCode}: ${e}`);
            process.exitCode = 1;
        }
    }
})();
