class Redirect {

    /**
     * Creates a new tab, navigated to a given start URL.
     * Then waits for a navigation to a given end URL and closes the tab.
     * @param {string} startURL The initial URL of the new tab
     * @param {string} endURL The URL that, when visited in the new tab, causes the closure of the spawned tab
     * @returns {Promise} The redirected URL on success (for additional processing on the query string and hash fragment)
     * or an error when the tab has been prematurely closed
     */
    static async waitForRedirect(startURL, endURL) {
        const tab = await browser.tabs.create({"url": startURL});

        return new Promise((resolve, reject) => {
            function webRequestListener({url}) {
                resolve(url);

                browser.webRequest.onBeforeRequest.removeListener(webRequestListener);
                // eslint-disable-next-line no-use-before-define -- Circular dependency
                browser.tabs.onRemoved.removeListener(tabsListener);

                browser.tabs.remove(tab.id);
                return {"cancel": true};
            }

            function tabsListener(tabId) {
                if (tabId === tab.id) {
                    reject(new Error("Tab was closed prematurely"));

                    browser.webRequest.onBeforeRequest.removeListener(webRequestListener);
                    browser.tabs.onRemoved.removeListener(tabsListener);
                }
            }

            browser.webRequest.onBeforeRequest.addListener(
                webRequestListener,
                {
                    "urls": [endURL],
                    "tabId": tab.id,
                },
                ["blocking"],
            );
            browser.tabs.onRemoved.addListener(tabsListener);
        });
    }
}

export {Redirect};
