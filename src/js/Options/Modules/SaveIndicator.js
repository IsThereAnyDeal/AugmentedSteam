import {TimeUtils} from "../../Core/Utils/TimeUtils";
import {Fader} from "./Fader";

class SaveIndicator {

    static saving() {
        if (this._currentSaves++ > 0) { return; }

        document.querySelector(".js-options-saving").classList.remove("is-hidden");
        document.querySelector(".js-options-saved").classList.add("is-hidden");

        this._promise = Fader.fadeIn(document.querySelector(".js-options-save"));
    }

    static async saved() {
        if (--this._currentSaves > 0) { return; }

        document.querySelector(".js-options-saving").classList.add("is-hidden");
        document.querySelector(".js-options-saved").classList.remove("is-hidden");

        await this._promise;
        this._promise = null;
        await TimeUtils.sleep(this.displayTime);

        if (this._promise !== null) { return; }

        Fader.fadeOut(document.querySelector(".js-options-save"));
    }

}

SaveIndicator.displayTime = 600;

SaveIndicator._promise = null;
SaveIndicator._currentSaves = 0;

export {SaveIndicator};
