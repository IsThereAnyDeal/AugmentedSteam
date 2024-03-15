import browser from "webextension-polyfill";

/** @deprecated */
class BackgroundSimple {
    static message(message) {
        return browser.runtime.sendMessage(message);
    }

    static action(requested, ...params) {
        if (!params.length) { return this.message({"action": requested}); }
        return this.message({"action": requested, "params": params});
    }
}

class BackgroundSender {
    static send<T, U>(message: T): Promise<U> {
        return browser.runtime.sendMessage(message);
    }
}

export {BackgroundSimple, BackgroundSender};
