class CallbackContext extends ASContext {

    callbacks = [];

    registerCallback(fn) {
        this.callbacks.push(fn);
    }

    triggerCallbacks(...params) {
        for (let callback of this.callbacks) {
            callback(...params);
        }
    }
}