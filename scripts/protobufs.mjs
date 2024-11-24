import {Command} from "commander";
import {execSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const __dirname = import.meta.dirname;
const root = `${__dirname}/../`;
const protoDir = path.join(root, "/src/js/Core/Protobufs/Module/");
const compiledDir = path.join(root, "/src/js/Core/Protobufs/Compiled/");

const program = new Command()

program.command("compile")
    .action(async (filepath, options) => {
        const protos = [
            "webui/service_wishlist"
        ];

        function run(command) {
            execSync(command, {
                "cwd": root
            }, (error, stdout, stderr) => {
                if (error) {
                    console.error(error);
                    process.exit(2);
                }
                console.log(stdout);
                if (stderr) {
                    console.error("Errors:", stderr);
                }
            });
        }

        for (let proto of protos) {
            const protoPath = path.join(protoDir, proto);
            const compilePath = path.join(compiledDir, proto);

            fs.mkdirSync(path.dirname(protoPath), {recursive: true});
            run(`pbjs -t static-module -w es6 --sparse ${protoPath}.proto > ${compilePath}.js`);
            run(`pbts -o ${compilePath}.d.ts ${compilePath}.js`);
            console.log(proto);
        }
    });

program.parse();
