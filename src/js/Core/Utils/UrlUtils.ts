
export default class UrlUtils {

    public static escapeUserUrl(url: string, replacements: Record<string, string>): string {
        if (!/^[^/]+\/\//.test(url)) {
            url = `https://${url}`;
        }

        for (const [pattern, replacement] of Object.entries(replacements)) {
            url = url.replace(`[${pattern}]`, encodeURIComponent(replacement));
        }
        return (new URL(url)).toString();
    }
}
