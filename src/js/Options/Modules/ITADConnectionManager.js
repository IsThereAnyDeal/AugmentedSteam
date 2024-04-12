import {__connect, __connected, __disconnect, __disconnected} from "../../../localization/compiled/_strings";
import {BackgroundSimple} from "../../Core/BackgroundSimple";
import {L} from "../../Core/Localization/Localization";

class ITADConnectionManager {

    constructor() {
        const [itadStatus, itadAction] = document.querySelectorAll(".js-itad-status, .js-itad-action");
        this._itadStatus = itadStatus;
        this._itadAction = itadAction;
    }

    async _clickHandler() {

        const connect = this._itadStatus.classList.contains("itad-status--disconnected");

        if (connect) {
            await BackgroundSimple.action("itad.authorize");
        } else {
            await BackgroundSimple.action("itad.disconnect");
        }

        this._itadStatus.textContent = L(connect ? __connected : __disconnected);
        this._itadAction.textContent = L(connect ? __disconnect : __connect);

        this._itadStatus.classList.toggle("itad-status--disconnected", !connect);
        this._itadStatus.classList.toggle("itad-status--connected", connect);
    }

    async run() {

        if (await BackgroundSimple.action("itad.isconnected")) {
            this._itadStatus.textContent = L(__connected);
            this._itadAction.textContent = L(__disconnect);
            this._itadStatus.classList.add("itad-status--connected");
        } else {
            this._itadStatus.textContent = L(__disconnected);
            this._itadAction.textContent = L(__connect);
            this._itadStatus.classList.add("itad-status--disconnected");
        }

        this._itadAction.addEventListener("click", () => { this._clickHandler(); });
    }
}

export {ITADConnectionManager};
