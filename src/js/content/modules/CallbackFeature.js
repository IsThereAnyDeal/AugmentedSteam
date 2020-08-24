import {ASFeature} from "modules/ASFeature";

export class CallbackFeature extends ASFeature {

    constructor(context, initialCall = true, setupFn) {

        super(context);

        this.initialCall = initialCall;

        if (typeof setupFn === "function") {
            setupFn();
        }
    }

    apply() {
        this.context.registerCallback((...params) => { this.callback(...params); });

        if (this.initialCall) {
            this.callback();
        }
    }
}
