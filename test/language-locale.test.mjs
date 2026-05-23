import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {build} from "esbuild";
import {DateTime} from "luxon";

async function importLanguage() {
    const result = await build({
        entryPoints: ["src/js/Core/Localization/Language.ts"],
        bundle: true,
        format: "esm",
        platform: "node",
        write: false
    });
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "as-language-"));
    const modulePath = path.join(tempDir, "Language.mjs");
    await fs.writeFile(modulePath, result.outputFiles[0].text);
    return import(pathToFileURL(modulePath));
}

const {default: Language} = await importLanguage();

const ukrainian = new Language("ukrainian");
assert.equal(ukrainian.code, "ua");
assert.equal(ukrainian.locale, "uk");

const thai = new Language("thai");
assert.equal(thai.code, "th");
assert.equal(thai.locale, "th-TH-u-ca-gregory");

const formattedThaiDate = DateTime.fromObject({
    year: 2026,
    month: 1,
    day: 23
}).toLocaleString({dateStyle: "medium"}, {locale: thai.locale});

assert.match(formattedThaiDate, /2026/);
assert.doesNotMatch(formattedThaiDate, /2569/);
