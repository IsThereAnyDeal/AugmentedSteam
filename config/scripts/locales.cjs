const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const Config = {
    exportUrl: "https://api.poeditor.com/v2/projects/export",
    apiToken: "8991d8f3eb8072b32b0e664d3a196384",
    projectId: 319277
}

// code in POE: our file name
const LanguageMap = {
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
}

async function loadLanguage(languageCode) {
    const data = new FormData();
    data.append('api_token', Config.apiToken);
    data.append('id', Config.projectId);
    data.append('language', languageCode);
    data.append('type', "key_value_json");

    let result = await axios.post(Config.exportUrl, data, { headers: data.getHeaders() });
    const response = result.data;

    if (response.response.code != 200) {
        throw Error;
    }

    const url = response.result.url;
    const filepath = `${__dirname}/../../src/localization/${LanguageMap[languageCode]}.json`
    result = await axios.get(url, {responseType: "stream"});
    result.data.pipe(fs.createWriteStream(filepath));
    return filepath;
}

for (let languageCode of Object.keys(LanguageMap)) {
    loadLanguage(languageCode)
        .then(path => console.log(`OK ${languageCode}: ${path}`))
        .catch(e => {
            console.error(`ERROR ${languageCode}`);
            console.error(e);
        });
}
