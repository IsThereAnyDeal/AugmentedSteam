import chalk from "chalk";
import {Command} from "commander";
import {readdir} from "node:fs/promises";
import path from "node:path";
import Compiler from "./tools/locale/compiler.mjs";
import Downloader from "./tools/locale/downloader.mjs";

const __dirname = import.meta.dirname;
const LocalizationsPath = `${__dirname}/../src/localization`;
const CompiledPath = `${__dirname}/../src/localization/compiled`;

let program = new Command();

program
    .command("download")
    .description("Download locales from POEditor")
    .action(async () => {
        const downloader = new Downloader(LocalizationsPath);
        await downloader.download();
    });

program
    .command("compile")
    .description("Compile locales")
    .action(async () => {
        const compiler = new Compiler(LocalizationsPath, CompiledPath);

        const en = await compiler.compile("en");
        const keys = new Set(Object.keys(en.strings));

        await compiler.saveKeyMap(keys);
        console.log(`${chalk.green("OK")} Strings`);

        await compiler.save("en", en);
        console.log(`${chalk.green("OK")} en`);

        const files = await readdir(LocalizationsPath, {recursive: false});
        for (const file of files) {
            if (path.extname(file) !== ".json") {
                continue;
            }

            const lang = path.basename(file, ".json");
            if (lang === "en") { continue; }

            const compiled = await compiler.compile(lang, en.strings, keys);
            await compiler.save(lang, compiled);
            console.log(`${chalk.green("OK")} ${lang}`);
        }
    });

program.parse();
