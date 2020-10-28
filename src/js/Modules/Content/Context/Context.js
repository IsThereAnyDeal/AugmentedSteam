import {FeatureManager} from "../Feature/FeatureManager";

class Context {

    constructor(features) {
        this._callbacks = [];
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
}

export {Context};
