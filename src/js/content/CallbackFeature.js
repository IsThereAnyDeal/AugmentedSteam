import { ASFeature } from "./ASFeature.js";

export class CallbackFeature extends ASFeature {

    apply() {
        this.context.registerCallback((...params) => { this.callback(...params); });
    }
}
