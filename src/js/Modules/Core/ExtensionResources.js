
class ExtensionResources {

    static getURL(pathname) {
        return browser.runtime.getURL(pathname);
    }

    static get(pathname) {
        return fetch(ExtensionResources.getURL(pathname));
    }

    static getJSON(pathname) {
        return ExtensionResources.get(pathname).then(r => r.json());
    }

    static getText(pathname) {
        return ExtensionResources.get(pathname).then(r => r.text());
    }
}

export {ExtensionResources};
