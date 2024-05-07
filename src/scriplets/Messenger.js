
class Messenger {
    static postMessage(name, params=undefined) {
        document.dispatchEvent(new CustomEvent(name, {detail: params}));
    }

    // Used for setting up a listener that should be able to receive more than one callback
    static Listen(name, listener) {
        window.addEventListener(name, e => listener(e.detail));
    }

    // Used for one-time events
    static onMessage(name) {
        return new Promise(resolve => {
            function callback(e) {
                resolve(e.detail);
                window.removeEventListener(name, callback);
            }
            window.addEventListener(name, callback);
        });
    }
}
