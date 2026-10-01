import {Command} from "commander";
import fss from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import {pbjs, pbts} from "protobufjs-cli";

const __dirname = import.meta.dirname;
const root = `${__dirname}/../`;
const protoDir = path.join(root, "/src/js/Core/Protobufs/Module/");
const tmpDir = path.join(root, "/src/js/Core/Protobufs/.tmp/");
const compiledDir = path.join(root, "/src/js/Core/Protobufs/Compiled/");
const bundleName = "proto.bundle";

const protos = [
    "webui/service_storebrowse",
    "webui/service_wishlist",
    "webui/service_player",
    "webui/service_quest"
];

const program = new Command()

/**
 * Some protobufs now contain default = Identifier, where identifier is not defined. We're replacing default with 0 here,
 * and crossing our fingers everything will still work
 */
async function preprocess() {
    const protoFiles = await fs.readdir(protoDir, {recursive: true});
    for (const file of protoFiles) {
        if (!/.proto$/.test(file)) { continue; }
        const srcpath = path.join(protoDir, file);
        const outpath = path.join(tmpDir, file);

        await fs.mkdir(path.dirname(outpath), {recursive: true});

        let contents = await fs.readFile(srcpath, {encoding: "utf-8"});
        contents = contents.replaceAll("default = Identifier", "default = 0 /* Identifier */");

        await fs.writeFile(outpath, contents);
    }
}

async function removeDir(path) {
    await fs.rm(path, {
        recursive: true,
        force: true
    });
}

program
    .command("compile")
    .action(async (filepath, options) => {
        // clear compiledDir
        await removeDir(compiledDir);
        await removeDir(tmpDir);

        await preprocess();
        await fs.mkdir(compiledDir, {recursive: true});

        pbjs.main([
            "-t", "static",
            "-w", "es6",
            "--no-delimited",
            "--no-create",
            "--no-convert",
            "--no-verify",
            ...protos.map(proto => path.join(tmpDir, proto+".proto"))
        ], (error, output) => {
            if (error) {
                throw error;
            }

            fss.writeFileSync(`${compiledDir}/${bundleName}.js`, "import {protobufjs as $protobuf} from \"@Protobufs/protobuf\";\n\n"+output);

            pbts.main(`${compiledDir}/${bundleName}.js`.split(" "), (error, output) => {
                if (error) {
                    throw error;
                }

                fss.writeFileSync(`${compiledDir}/${bundleName}.d.ts`, output);
            });
        });

        await removeDir(tmpDir);
    });

program.parse();
