
export default class UrlUtils {

    public static escapeUserUrl(url: string, replacements: Record<string, string>): string {
        for (const [pattern, replacement] of Object.entries(replacements)) {
            url = url.replace(`[${pattern}]`, replacement);
        }
        return (new URL(url)).toString();
    }
}
