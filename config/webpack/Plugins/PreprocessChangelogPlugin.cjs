const YAML = require("yaml");
const fs = require("fs");
const {marked} = require("marked");

class PreprocessChangelogPlugin {

    constructor(options) {
        this._changelogPath = options.path;
    }

    apply(compiler) {

        compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {

            compilation.hooks.processAssets.tap({
                "name": `${this.constructor.name}_compilation`,
                "stage": compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            }, (assets) => {

                const changelog = fs.readFileSync(this._changelogPath, {
                    "encoding": "utf8",
                    "flag": "r"
                });
                const json = YAML.parse(changelog);

                const result = {};
                for (const [version, md] of Object.entries(json)) {
                    result[version] = marked(md);
                }

                const jsonString = JSON.stringify(result);

                compilation.emitAsset("changelog.json", {
                    "source": () => jsonString,
                    "size": () => jsonString.length
                });
            });

        });
    }
}

module.exports = PreprocessChangelogPlugin;
