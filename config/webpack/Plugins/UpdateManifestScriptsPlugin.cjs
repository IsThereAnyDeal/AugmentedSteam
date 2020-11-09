
/**
 * Adds JS or CSS file to each content_scripts entry in extension manifest
 * New files are added at the beginning
 * // TODO better name?
 */
class UpdateManifestScriptsPlugin {

    constructor(options) {
        this._js = options.js || [];
        this._css = options.css || [];
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync(this.constructor.name, (compilation, callback) => {
            const asset = compilation.getAsset("manifest.json");
            const source = asset.source;

            const data = JSON.parse(source.source());

            for (const entry of data.content_scripts) {
                for (const path of this._js) {
                    entry.js.unshift(path);
                }

                for (const path of this._css) {
                    entry.css.unshift(path);
                }
            }

            const result = JSON.stringify(data);

            compilation.updateAsset(asset.name, {
                "size": () => result.length,
                "source": () => result
            });

            callback();
        });
    }
}

module.exports = UpdateManifestScriptsPlugin;
