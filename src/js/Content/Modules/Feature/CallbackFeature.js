import {Feature} from "./Feature";

class CallbackFeature extends Feature {

    constructor(context, initialCall = true) {

        super(context);

        this.initialCall = initialCall;
    }

    apply() {
        this.context.registerCallback((...params) => { this.callback(...params); });

        if (this.initialCall) {
            this.callback();
        }
    }
}

export {CallbackFeature};
