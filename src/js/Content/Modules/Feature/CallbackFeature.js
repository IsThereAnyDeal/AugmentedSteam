import {Feature} from "./Feature";

class CallbackFeature extends Feature {

    constructor(context, initialCall = true, setupFn = null) {

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

export {CallbackFeature};
