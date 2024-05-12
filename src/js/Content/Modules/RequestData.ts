import Errors from "@Core/Errors/Errors";

declare global {
    let content: any;
}

export default class RequestData {

    /**
     * In Firefox, the global fetch lies in the sandbox environment, thus we have to
     * access the fetch function of the content window.
     * See https://bugzilla.mozilla.org/show_bug.cgi?id=1579347#c5
     */
    // FIXME this will not work anymore in Manifest V3
    private static _fetchFn
        = (typeof content !== "undefined" && content && content.fetch)
        || fetch.bind(window);


    private static async getHttp(url: URL|string, settings: RequestInit = {}): Promise<Response> {

        const _settings = {
            "method": "GET",
            "credentials": "include",
            "headers": {"origin": window.location.origin},
            "referrer": window.location.origin + window.location.pathname,
            ...settings
        };

        document.dispatchEvent(new CustomEvent("asRequestStart"));

        let response;
        try {
            response = await RequestData._fetchFn(url, _settings);

            if (!response.ok) {
                throw new Errors.HTTPError(response.status, `HTTP ${response.status} ${response.statusText} for ${response.url}`);
            }
        } catch (e) {
            document.dispatchEvent(new CustomEvent("asRequestError", {detail: e}));
            throw e;
        }

        document.dispatchEvent(new CustomEvent("asRequestDone"));
        return response;
    }

    static async getText(url: URL|string, settings: RequestInit={}): Promise<string> {
        const response = await this.getHttp(url, settings);
        return response.text();
    }

    static async getJson<T>(url: URL|string, settings: RequestInit={}): Promise<T> {
        const response = await this.getHttp(url, settings);
        return response.json();
    }

    static async getBlob(url: URL|string, settings: RequestInit={}): Promise<Blob> {
        const response = await this.getHttp(url, settings);
        return response.blob();
    }

    static async post(
        url: URL|string,
        data: Record<string, string>,
        settings: RequestInit = {}
    ): Promise<Response> {

        const _settings = {
            "method": "POST",
            "body": new URLSearchParams(data),
            "credentials": "include",
            "headers": {"origin": window.location.origin},
            "referrer": window.location.origin + window.location.pathname,
            ...settings
        };

        return await RequestData._fetchFn(url, _settings);
    }
}
