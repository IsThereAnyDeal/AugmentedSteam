import {CStoreBase} from "./CStoreBase";
import {ContextType} from "../../../modulesContent";

export class CStoreBaseCallback extends CStoreBase {

    constructor(type = ContextType.STORE_DEFAULT, features = []) {
        super(type, features);

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
