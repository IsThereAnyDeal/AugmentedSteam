
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
        compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {

            compilation.hooks.processAssets.tap({
                "name": `${this.constructor.name}_compilation`,
                "stage": compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS
            }, (assets) => {
                const manifest = "manifest.json";
                const source = assets[manifest];

                const data = JSON.parse(source.source());

                for (const entry of data.content_scripts) {

                    for (const [prop, val] of Object.entries(entry)) {
                        if (!Array.isArray(val)) {
                            entry[prop] = [val];
                        }
                    }

                    if (typeof entry.css === "undefined") {
                        entry.css = ["css/augmentedsteam.css"];
                    }

                    entry.matches = this._transformMatches(entry.matches);
                    // eslint-disable-next-line camelcase -- This property name is enforced by the manifest syntax
                    entry.exclude_matches = this._transformMatches(entry.exclude_matches);

                    for (const path of this._js) {
                        entry.js.unshift(path);
                    }

                    for (const path of this._css) {
                        entry.css.unshift(path);
                    }
                }

                const result = JSON.stringify(data);

                compilation.updateAsset(manifest, {
                    "size": () => result.length,
                    "source": () => result
                });
            });
        });
    }

    _transformMatches(matches) {

        if (!Array.isArray(matches)) { return undefined; }

        const results = [];

        for (const match of matches) {

            const parsedMatches = this._parseOptional(match);

            for (const match of parsedMatches) {

                results.push(match);

                if (match.endsWith("*") || match.endsWith("/")) { continue; }

                results.push(`${match}?*`);

                if (!parsedMatches.includes(`${match}/*`)) {
                    results.push(
                        `${match}/`,
                        `${match}/?*`,
                    );
                }
            }
        }

        return results;
    }

    _parseOptional(match) {

        /*
         * Allows (very basic) optional strings in a match string by surrounding the optional part
         * with brackets, e.g. "example.com/some_page[/]"
         */
        const regex = /\[.+]/gd;
        let results = regex.exec(match);

        if (results === null) {
            return [match];
        }

        let newMatches = [];

        do {
            const [startIndex, endIndex] = results.indices[0];
            const firstHalf = match.substring(0, startIndex);
            const secondHalf = match.substring(endIndex);
            const optional = results[0].slice(1, -1);

            const withOptional = firstHalf + optional + secondHalf;
            const withoutOptional = firstHalf + secondHalf;

            // If there is more than just one optional part, do a recursive call
            newMatches = newMatches.concat(
                this._parseOptional(withOptional),
                this._parseOptional(withoutOptional)
            );
        } while ((results = regex.exec(match)) !== null);

        return newMatches;
    }
}

module.exports = ManifestTransformerPlugin;
