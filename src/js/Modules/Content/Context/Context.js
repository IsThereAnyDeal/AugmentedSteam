import {FeatureManager} from "../Feature/FeatureManager";
import {Messenger} from "../Messenger";

class Context {

    constructor(type, features) {
        this._callbacks = [];
        this.type = type;
        this.features = features.map(Ref => new Ref(this));
    }

    applyFeatures() {
        return FeatureManager.apply(this.features);
    }

    registerCallback(fn) {
        this._callbacks.push(fn);
    }

    triggerCallbacks(...params) {
        for (const callback of this._callbacks) {
            callback(...params);
        }
    }

    /*
     * NOTE: use cautiously!
     * Run script in the context of the current tab
     */
    runInPageContext(fun, args, withPromise) {
        const script = document.createElement("script");
        let promise;
        const argsString = Array.isArray(args) ? JSON.stringify(args) : "[]";

        if (withPromise) {
            const msgId = `msg_${++Context._msgCounter}`;
            promise = Messenger.onMessage(msgId);
            script.textContent = `(async () => { Messenger.postMessage("${msgId}", await (${fun})(...${argsString})); })();`;
        } else {
            script.textContent = `(${fun})(...${argsString});`;
        }

        document.documentElement.appendChild(script);
        script.parentNode.removeChild(script);
        return promise;
    }
}
Context._msgCounter = 0;

export {Context};
