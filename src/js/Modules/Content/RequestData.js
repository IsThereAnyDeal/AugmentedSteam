import {HTTPError} from "../../Content/common";
import {ProgressBar} from "./Widgets/ProgressBar";

class RequestData {

    static getHttp(url, settings, responseType = "text") {

        let _url = url;
        const _settings = settings || {};

        _settings.method = _settings.method || "GET";
        _settings.credentials = _settings.credentials || "include";
        _settings.headers = _settings.headers || {"origin": window.location.origin};
        _settings.referrer = _settings.referrer || window.location.origin + window.location.pathname;

        ProgressBar.startRequest();

        if (_url.startsWith("//")) { // TODO remove when not needed
            _url = window.location.protocol + url;
            console.warn("Requesting URL without protocol, please update");
        }

        return RequestData._fetchFn(_url, _settings).then(response => {

            ProgressBar.finishRequest();

            if (!response.ok) {
                throw new HTTPError(response.status, `HTTP ${response.status} ${response.statusText} for ${response.url}`);
            }

            return response[responseType]();

        })
            .catch(err => {
                ProgressBar.failed();
                throw err;
            });
    }

    static post(url, formData, settings, returnJSON) {
        return RequestData.getHttp(url, Object.assign(settings || {}, {
            "method": "POST",
            "body": formData
        }), returnJSON ? "json" : "text");
    }

    static getJson(url, settings) {
        return RequestData.getHttp(url, settings, "json");
    }

    static getBlob(url, settings) {
        return RequestData.getHttp(url, settings, "blob");
    }
}

/**
 * In Firefox, the global fetch lies in the sandbox environment, thus we have to
 * access the fetch function of the content window.
 * See https://bugzilla.mozilla.org/show_bug.cgi?id=1579347#c5
 */
RequestData._fetchFn

    // content.fetch is already bound
    // eslint-disable-next-line no-undef -- content is only available in FF environments
    = (typeof content !== "undefined" && content && content.fetch)
    || fetch.bind(window);

export {RequestData};
