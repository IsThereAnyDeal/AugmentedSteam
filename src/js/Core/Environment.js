
class Environment {

    static get contextType() {
        if (browser.extension.getBackgroundPage) {
            const bgPage = browser.extension.getBackgroundPage();

            return bgPage === window
                ? Environment.ContextType.BACKGROUND
                : Environment.ContextType.OPTIONS;
        }

        return Environment.ContextType.CONTENT_SCRIPT;
    }
}

Environment.ContextType = Object.freeze({
    "BACKGROUND": 1,
    "CONTENT_SCRIPT": 2,
    "OPTIONS": 3,
});


export {Environment};
