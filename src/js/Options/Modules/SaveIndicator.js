import {Fader} from "./Fader";

class SaveIndicator {

    static show() {
        const node = document.getElementById("saved");
        if (!node) { return; }

        Fader.fadeInFadeOut(node);
    }

}

export {SaveIndicator};
