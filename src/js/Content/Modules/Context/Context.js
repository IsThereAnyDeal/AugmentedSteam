import {FeatureManager} from "../Feature/FeatureManager";

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
        return Promise.all(
            this._callbacks.map(callback => callback(...params))
        );
    }
}

export {Context};
