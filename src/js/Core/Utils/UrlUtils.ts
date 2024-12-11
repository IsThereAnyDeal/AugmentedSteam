
export default class UrlUtils {

    public static escapeUserUrl(url: string, replacements: Record<string, string>): string|null {
        if (!/^[^/]+\/\//.test(url)) {
            url = `https://${url}`;
        }

        for (const [pattern, replacement] of Object.entries(replacements)) {
            url = url.replace(`[${pattern}]`, encodeURIComponent(replacement));
        }

        return URL.parse(url)?.toString() ?? null;
    }
}
