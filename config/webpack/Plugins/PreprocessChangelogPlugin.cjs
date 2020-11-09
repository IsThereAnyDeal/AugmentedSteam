const YAML = require("yaml");
const fs = require("fs");
const marked = require("marked");

class PreprocessChangelogPlugin {

    constructor(options) {
        this._changelogPath = options.path;
    }

    apply(compiler) {

        compiler.hooks.emit.tapAsync(this.constructor.name, (compilation, callback) => {
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

            compilation.assets["changelog.json"] = {
                "source": () => jsonString,
                "size": () => jsonString.length
            };

            callback();
        });
    }
}

module.exports = PreprocessChangelogPlugin;
