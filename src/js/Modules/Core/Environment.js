
const ContextType = Object.freeze({
    "BACKGROUND": 1,
    "CONTENT_SCRIPT": 2,
    "OPTIONS": 3,
});

let currentContext;
if (browser.extension.getBackgroundPage) {
    const bgPage = browser.extension.getBackgroundPage();

    currentContext = (bgPage === window)
        ? ContextType.BACKGROUND
        : ContextType.OPTIONS;
} else {
    currentContext = ContextType.CONTENT_SCRIPT;
}

class Environment {

    static isBackgroundScript() {
        return currentContext === ContextType.BACKGROUND;
    }

    static isContentScript() {
        return currentContext === ContextType.CONTENT_SCRIPT;
    }

    static isOptions() {
        return currentContext === ContextType.OPTIONS;
    }
}

export {Environment};
