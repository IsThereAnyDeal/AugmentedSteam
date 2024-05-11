
class Messenger {
    static send(name, data=undefined) {
        document.dispatchEvent(new CustomEvent(name, {detail: data}));
    }

    // Used for setting up a listener that should be able to receive more than one callback
    static listen(name, listener) {
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
