import browser from "webextension-polyfill";

enum ContextType {
    Background,
    ContentScript,
    Options
}

let currentContext: ContextType;
if (browser.extension.getBackgroundPage) {
    const bgPage = browser.extension.getBackgroundPage();

    currentContext = (bgPage === window)
        ? ContextType.Background
        : ContextType.Options;
} else {
    currentContext = ContextType.ContentScript;
}

export default class Environment {

    static isBackgroundScript(): boolean {
        return currentContext === ContextType.Background;
    }

    static isContentScript(): boolean {
        return currentContext === ContextType.ContentScript;
    }

    static isOptions(): boolean {
        return currentContext === ContextType.Options;
    }
}
