import {Command} from "commander";
import fs from "node:fs";
import path from "node:path";
import {pbjs, pbts} from "protobufjs-cli";

const __dirname = import.meta.dirname;
const root = `${__dirname}/../`;
const protoDir = path.join(root, "/src/js/Core/Protobufs/Module/");
const compiledDir = path.join(root, "/src/js/Core/Protobufs/Compiled/");
const bundleName = "proto.bundle";

const protos = [
    "webui/service_storebrowse",
    "webui/service_wishlist"
];

const program = new Command()

program
    .command("compile")
    .action(async (filepath, options) => {
        // clear compiledDir
        fs.rmSync(compiledDir, {
            recursive: true,
            force: true
        });

        fs.mkdirSync(compiledDir, {recursive: true});

        pbjs.main([
            "-t", "static",
            "-w", "es6",
            "--no-delimited",
            "--no-create",
            "--no-convert",
            "--no-verify",
            ...protos.map(proto => path.join(protoDir, proto+".proto"))
        ], (error, output) => {
            if (error) {
                throw error;
            }

            fs.writeFileSync(`${compiledDir}/${bundleName}.js`, "import {protobufjs as $protobuf} from \"@Protobufs/protobuf\";\n\n"+output);

            pbts.main(`${compiledDir}/${bundleName}.js`.split(" "), (error, output) => {
                if (error) {
                    throw error;
                }

                fs.writeFileSync(`${compiledDir}/${bundleName}.d.ts`, output);
            });
        });
    });

program.parse();
