import {open, writeFile} from "node:fs/promises";

export default class Compiler {

    constructor(localizationsPath, compiledPath) {
        this.localizationsPath = localizationsPath;
        this.compiledPath = compiledPath;
    }

    async _load(lang) {
        const path = `${this.localizationsPath}/${lang}.json`;

        let file = await open(path);
        let contents = await file.readFile({encoding: "utf8"});
        await file.close();
        return JSON.parse(contents);
    }

    *_traverse(locale, prefix= "") {
        for (let [key, value] of Object.entries(locale)) {
            if (typeof value === "object") {
                yield* this._traverse(value, prefix+key+".");
            } else {
                yield [prefix+key, value];
            }
        }
    }

    _transposeKey(key) {
        return key
            .replace(/[_-]([a-z])/g, (match, p1) => p1.toUpperCase())
            .replace(/\./g, "_");
    }

    async compile(lang, defaults= {}, filter = null){
        const locale = await this._load(lang);

        let translated = 0;
        let result = structuredClone(defaults);
        for (let [key, value] of this._traverse(locale)) {
            key = this._transposeKey(key);
            if (filter !== null && !filter.has(key)) {
                continue;
            }

            result[key] = value;
            translated++;
        }
        return {
            stats: {
                strings: Object.keys(result).length,
                translated: translated
            },
            strings: result
        };
    }

    async save(lang, compiled) {
        await writeFile(`${this.compiledPath}/${lang}.json`, JSON.stringify(compiled));
    }

    async saveKeyMap(keys) {

        let result = "";
        for (let key of keys) {
            result += `export const __${key} = "${key}";\n`
        }

        await writeFile(`${this.compiledPath}/_strings.ts`, result);
    }
}
