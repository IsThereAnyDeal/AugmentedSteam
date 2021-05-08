
/**
 * - Adds JS or CSS file to each content_scripts entry in extension manifest
 * - Adds common match variants to existing matches (match query string, trailing slash)
 */
class ManifestTransformerPlugin {

    constructor(options) {
        this._js = options.js || [];
        this._css = options.css || [];
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync(this.constructor.name, (compilation, callback) => {
            const asset = compilation.getAsset("manifest.json");
            const source = asset.source;

            const data = JSON.parse(source.source());

            for (const {matches, exclude_matches, js, css} of data.content_scripts) {

                this._addMatchVariants(matches);

                if (Array.isArray(exclude_matches)) {
                    this._addMatchVariants(exclude_matches);
                }

                for (const path of this._js) {
                    js.unshift(path);
                }

                for (const path of this._css) {
                    css.unshift(path);
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

    _addMatchVariants(matches) {
        for (const match of matches) {

            if (match.endsWith("*") || match.endsWith("/")) { continue; }

            if (!matches.includes(`${match}/*`)) {
                matches.push(`${match}/`);
            }

            matches.push(
                `${match}?*`,
                `${match}/?*`,
            );
        }
    }
}

module.exports = ManifestTransformerPlugin;
