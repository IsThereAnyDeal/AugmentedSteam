import webpack, {type Compiler, type WebpackPluginInstance} from "webpack";

type Options = {
    js?: string[];
    css?: string[];
};

type Manifest = {
    content_scripts: {
        matches: string[];
        js: string[];
        css?: string[];
        exclude_matches?: string[];
    }[];
};

/**
 * - Adds JS or CSS file to each content_scripts entry in extension manifest
 * - Adds common match variants to existing matches (match query string, trailing slash)
 */
export default class ManifestTransformerPlugin implements WebpackPluginInstance {

    private readonly js: string[];
    private readonly css: string[];

    public constructor(options: Options) {
        this.js = options.js ?? [];
        this.css = options.css ?? [];
    }

    public apply(compiler: Compiler): void {
        compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {

            compilation.hooks.processAssets.tap({
                "name": `${this.constructor.name}_compilation`,
                "stage": webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
            }, (assets) => {
                const manifestName = "manifest.json";
                const source = assets[manifestName];

                if (!source) {
                    throw new Error("");
                }

                const manifest = JSON.parse(source.source().toString()) as Manifest;

                for (const cs of manifest.content_scripts) {
                    cs.css ??= ["css/augmentedsteam.css"];
                    cs.matches = this.transformMatches(cs.matches);
                    // eslint-disable-next-line camelcase -- This property name is enforced by the manifest syntax
                    cs.exclude_matches &&= this.transformMatches(cs.exclude_matches);

                    cs.js.unshift(...this.js);
                    cs.css.unshift(...this.css);
                }

                const result = JSON.stringify(manifest);

                compilation.updateAsset(
                    manifestName,
                    new webpack.sources.RawSource(result),
                    (info) => {
                        if (!info) { return info; }
                        info.size ??= result.length;
                        return info;
                    },
                );
            });
        });
    }

    private transformMatches(matches: string[]): string[] {
        const results: string[] = [];
        for (const match of matches) {

            const parsedMatches = this.parseOptional(match);

            for (const match of parsedMatches) {

                results.push(match);

                if (match.endsWith("*") || match.endsWith("/") || match.includes("?")) { continue; }

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

    private parseOptional(match: string): string[] {

        /*
         * Allows (very basic) optional strings in a match string by surrounding the optional part
         * with brackets, e.g. "example.com/some_page[/]"
         */
        const regex = /\[.+]/gd;
        let results = regex.exec(match);

        if (results === null) {
            return [match];
        }

        let newMatches: string[] = [];

        do {
            if (!results.indices?.[0]) {
                throw new Error('Missing "indices" information from regex search results');
            }
            const [startIndex, endIndex] = results.indices[0];
            const firstHalf = match.substring(0, startIndex);
            const secondHalf = match.substring(endIndex);
            const optional = results[0].slice(1, -1);

            const withOptional = firstHalf + optional + secondHalf;
            const withoutOptional = firstHalf + secondHalf;

            // If there is more than just one optional part, do a recursive call
            newMatches = newMatches.concat(
                this.parseOptional(withOptional),
                this.parseOptional(withoutOptional)
            );
        } while ((results = regex.exec(match)) !== null);

        return newMatches;
    }
}
