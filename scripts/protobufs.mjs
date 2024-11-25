import {Command} from "commander";
import {execSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {pbjs, pbts} from "protobufjs-cli";

const __dirname = import.meta.dirname;
const root = `${__dirname}/../`;
const protoDir = path.join(root, "/src/js/Core/Protobufs/Module/");
const compiledDir = path.join(root, "/src/js/Core/Protobufs/Compiled/");

const protos = [
    "webui/service_wishlist"
];

const program = new Command()

program
    .command("compile")
    .action(async (filepath, options) => {
        for (let proto of protos) {
            const protoPath = path.join(protoDir, proto);
            let compilePath = path.join(compiledDir, proto);

            fs.mkdirSync(path.dirname(protoPath), {recursive: true});

            pbjs.main(`-t static -w es6 --no-delimited --no-create --no-convert --no-verify --force-long ${protoPath}.proto`.split(" "), (error, output) => {
                if (error) {
                    throw error;
                }

                fs.writeFileSync(`${compilePath}.js`, "import {protobufjs as $protobuf} from \"@Protobufs/protobuf\";\n\n"+output);

                pbts.main(`${compilePath}.js`.split(" "), (error, output) => {
                    if (error) {
                        throw error;
                    }

                    fs.writeFileSync(`${compilePath}.d.ts`, output);
                    console.log(proto);
                });
            });
        }
    });

program.parse();
