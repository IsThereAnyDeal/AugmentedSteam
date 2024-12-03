import createDOMPurify from "dompurify";
import fs from "node:fs/promises";
import chalk from "chalk";
import axios from "axios";
import FormData from "form-data";
import {JSDOM} from "jsdom";
import {POEDITOR_APIKEY} from "./.keys.mjs";

const window = new JSDOM().window;
const DOMPurify = createDOMPurify(window);

// Disallow all tags, only plain text is allowed for translations
DOMPurify.setConfig({"ALLOWED_TAGS": []});

const Config = {
    "apiHost": "https://api.poeditor.com",
    "apiToken": POEDITOR_APIKEY,
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
    "id": "id",
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


export default class Downloader {

    constructor(targetPath) {
        this.targetPath = targetPath;
    }

    _checkTranslations(translation, key = "") {
        if (typeof translation === "string") {
            const sanitized = DOMPurify.sanitize(translation);
            if (sanitized !== translation) {
                throw new Error(`translation for ${key} contains tags`);
            }
        } else if (typeof translation === "object" && translation !== null) {
            for (const [k, v] of Object.entries(translation)) {
                this._checkTranslations(v, `${key}${key ? "." : ""}${k}`);
            }
        } else {
            throw new Error(`unknown translation value: ${translation}`);
        }
    }

    async _loadLanguage(languageCode) {
        const data = new FormData();
        data.append("api_token", Config.apiToken);
        data.append("id", Config.projectId);
        data.append("language", languageCode);
        data.append("type", "key_value_json");
        data.append("filters", JSON.stringify(["translated", "not_fuzzy"]));

        let result = await axios.post(Config.apiHost + "/v2/projects/export", data, {"headers": data.getHeaders()});
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

        this._checkTranslations(translation);

        const filepath = `${this.targetPath}/${LANGUAGE_MAP[languageCode]}.json`;
        await fs.writeFile(filepath, rawJSON);

        return filepath;
    }

    async _loadContributors() {
        const data = new FormData();
        data.append("api_token", Config.apiToken);
        data.append("id", Config.projectId);

        const {response, result} = (await axios.post(Config.apiHost + "/v2/contributors/list", data)).data;
        if (response.code !== "200") {
            throw Error;
        }

        const map = {};
        for (const user of result.contributors) {
            for (const perm of user.permissions) {
                for (const poeLang of perm.languages ?? []) {
                    const lang = LANGUAGE_MAP[poeLang];
                    map[lang] ??= [];
                    map[lang].push(user.name);
                }
            }
        }

        const filepath = `${this.targetPath}/_contributors.json`;
        await fs.writeFile(filepath, JSON.stringify(map, null, 2));
    }

    async download() {

        for (const languageCode of Object.keys(LANGUAGE_MAP)) {
            try {
                const path = await this._loadLanguage(languageCode);
                console.log(`${chalk.green("OK")} ${languageCode}: ${path}`);
            } catch (e) {
                console.error(`${chalk.red("ERROR")} ${languageCode}: ${e}`);
                process.exitCode = 1;
            }
        }

        try {
            await this._loadContributors();
            console.log(`${chalk.green("OK")} Contributors`);
        } catch (e) {
            console.error(`${chalk.red("ERROR")} Contributors: ${e}`);
            process.exitCode = 1;
        }
    }
}
