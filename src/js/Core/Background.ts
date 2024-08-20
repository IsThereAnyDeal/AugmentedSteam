import browser from "webextension-polyfill";
import ErrorParser from "@Core/Errors/ErrorParser";

export default class Background {

    static async send<Response>(action: string, params: Record<string, any>={}): Promise<Response> {
        document.dispatchEvent(new CustomEvent("asRequestStart"));
        try {
            const result = await browser.runtime.sendMessage({action, params});
            document.dispatchEvent(new CustomEvent("asRequestDone"));
            return result;
        } catch(e: any) {
            const error = ErrorParser.parse(e.message ?? "");
            document.dispatchEvent(new CustomEvent("asRequestError", {detail: error}));
            throw e;
        }
    }
}
