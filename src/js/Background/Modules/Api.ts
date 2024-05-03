import Errors from "@Core/Errors/Errors";

export default abstract class Api {

    private readonly origin: string;

    protected constructor(origin: string) {
        this.origin = origin;
    }

    protected getUrl(path: string, query: Record<string, string|number|undefined> = {}): URL {
        let url = new URL(path, this.origin);
        for (let [key, value] of Object.entries(query)) {
            if (value === undefined) {
                continue
            }
            url.searchParams.set(key, String(value));
        }
        return url
    }

    protected async fetchJson<T>(
        url: string|URL,
        init: RequestInit = {}
    ): Promise<T> {
        let response = await fetch(url, init);

        if (!response.ok) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }

        return await response.json();
    }

    protected async fetchText(
        url: string|URL,
        init: RequestInit = {}
    ): Promise<string> {
        let response = await fetch(url, init);

        if (!response.ok) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }

        return await response.text();
    }
}

