import {ProgressBar} from "./Widgets/ProgressBar";
import {Errors} from "../../Core/Errors/Errors";

class RequestData {

    static async getHttp(url, settings = {}, responseType = "text") {

        let _url = url;
        if (_url.startsWith("//")) { // TODO remove when not needed
            _url = window.location.protocol + url;
            console.warn("Requesting URL without protocol, please update");
        }

        const _settings = {
            "method": "GET",
            "credentials": "include",
            "headers": {"origin": window.location.origin},
            "referrer": window.location.origin + window.location.pathname,
            ...settings
        };

        ProgressBar.startRequest();

        let response;

        try {
            response = await RequestData._fetchFn(_url, _settings);

            if (!response.ok) {
                throw new Errors.HTTPError(response.status, `HTTP ${response.status} ${response.statusText} for ${response.url}`);
            }
        } catch (err) {
            ProgressBar.failed();
            throw err;
        }

        ProgressBar.finishRequest();

        return responseType === "none" ? response : response[responseType]();
    }

    static post(url, formData, settings = {}, returnJSON = false) {

        const _settings = {
            ...settings,
            "method": "POST",
            "body": formData
        };

        let _responseType;
        if (typeof returnJSON === "string") {
            _responseType = returnJSON;
        } else if (returnJSON) {
            _responseType = "json";
        } else {
            _responseType = "text";
        }
        
        return RequestData.getHttp(url, _settings, _responseType);
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
    // eslint-disable-next-line no-undef
    = (typeof content !== "undefined" && content && content.fetch) // content is only available in FF environments
    || fetch.bind(window);

export {RequestData};
