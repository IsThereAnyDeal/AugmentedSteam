import {Fader} from "./Fader";

class SaveIndicator {

    static show() {
        const node = document.querySelector(".js-options-saved");
        if (!node) { return; }

        Fader.fadeInFadeOut(node);
    }

}

export {SaveIndicator};
