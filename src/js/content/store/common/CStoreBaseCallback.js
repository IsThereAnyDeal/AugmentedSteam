import {CStoreBase} from "./CStoreBase.js";

export class CStoreBaseCallback extends CStoreBase {

    constructor(features = []) {
        super(features);

        this._callbacks = [];
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
