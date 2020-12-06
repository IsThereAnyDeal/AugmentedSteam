import {CStoreBase} from "./CStoreBase";

export class CStoreBaseCallback extends CStoreBase {

    constructor(context, features = []) {
        super(context, features);

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
