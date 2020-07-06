import {ASFeature} from "modules/ASFeature";

export class CallbackFeature extends ASFeature {

    apply() {
        this.context.registerCallback((...params) => { this.callback(...params); });
    }
}
