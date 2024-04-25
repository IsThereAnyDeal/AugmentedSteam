import browser from "webextension-polyfill";

/** @deprecated */
class BackgroundSimple {

    /** @deprecated */
    static message(message) {
        return browser.runtime.sendMessage(message);
    }

    /** @deprecated */
    static action(requested, ...params) {
        if (!params.length) { return this.message({"action": requested}); }
        return this.message({"action": requested, "params": params});
    }
}

class BackgroundSender {
    static send<Request, Response>(message: Request): Promise<Response> {
        return browser.runtime.sendMessage(message);
    }

    static send2<Response>(action: string, params: Record<string, any>={}): Promise<Response> {
        return browser.runtime.sendMessage({action, params});
    }
}

export {BackgroundSimple, BackgroundSender};
