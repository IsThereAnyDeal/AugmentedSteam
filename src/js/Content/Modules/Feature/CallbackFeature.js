import {Feature} from "./Feature";

class CallbackFeature extends Feature {

    apply() {
        this.context.registerCallback((...params) => { this.callback(...params); });

        if (typeof this.setup === "function") {
            this.setup();
        }
    }
}

export {CallbackFeature};
