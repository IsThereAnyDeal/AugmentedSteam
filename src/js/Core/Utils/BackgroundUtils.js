
class BackgroundUtils {
    static message(message) {
        return browser.runtime.sendMessage(message);
    }

    static action(requested, ...params) {
        if (!params.length) { return this.message({"action": requested}); }
        return this.message({"action": requested, "params": params});
    }
}

export {BackgroundUtils};
