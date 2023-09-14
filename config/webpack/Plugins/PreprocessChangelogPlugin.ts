import YAML from "yaml";
import fs from "fs";
import {marked} from "marked";
import webpack, {type Compiler, type WebpackPluginInstance} from "webpack";

marked.use({
    "mangle": false,
    "headerIds": false,
});

type Options = {
    "path": string;
};

type Changelog = Record<string, string>;

export default class PreprocessChangelogPlugin implements WebpackPluginInstance {

    private readonly changelogPath: string;

    public constructor(options: Options) {
        this.changelogPath = options.path;
    }

    public apply(compiler: Compiler): void {

        compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {

            compilation.hooks.processAssets.tap({
                "name": `${this.constructor.name}_compilation`,
                "stage": webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            }, () => {

                const changelogRaw = fs.readFileSync(this.changelogPath, {
                    "encoding": "utf8",
                    "flag": "r"
                });
                const changelog = YAML.parse(changelogRaw) as Changelog;

                for (const [version, md] of Object.entries(changelog)) {
                    changelog[version] = marked(md);
                }

                const jsonString = JSON.stringify(changelog);

                compilation.emitAsset(
                    "changelog.json",
                    new webpack.sources.RawSource(jsonString)
                );
            });

        });
    }
}
