
export default class UrlUtils {

    public static escapeUserUrl(url: string, replacements: Record<string, string>): string {
        const result = new URL(url);

        /*
         * For some reason
         *  for (const ... of result.searchParams.entries())
         *  does not work, and I have no idea why (says it's not iterable)
         */

        result.searchParams.forEach((value, name, searchParams) => {
            for (const [pattern, replacement] of Object.entries(replacements)) {
                value = value.replace(`[${pattern}]`, replacement);
            }
            searchParams.set(name, value);
        });
        return result.toString();
    }
}
