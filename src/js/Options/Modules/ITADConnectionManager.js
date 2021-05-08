import {BackgroundSimple} from "../../Core/BackgroundSimple";
import {Localization} from "../../Core/Localization/Localization";

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

        this._itadStatus.textContent = connect ? Localization.str.connected : Localization.str.disconnected;
        this._itadAction.textContent = connect ? Localization.str.disconnect : Localization.str.connect;

        this._itadStatus.classList.toggle("itad-status--disconnected", !connect);
        this._itadStatus.classList.toggle("itad-status--connected", connect);
    }

    async run() {

        if (await BackgroundSimple.action("itad.isconnected")) {
            this._itadStatus.textContent = Localization.str.connected;
            this._itadAction.textContent = Localization.str.disconnect;
            this._itadStatus.classList.add("itad-status--connected");
        } else {
            this._itadStatus.textContent = Localization.str.disconnected;
            this._itadAction.textContent = Localization.str.connect;
            this._itadStatus.classList.add("itad-status--disconnected");
        }

        this._itadAction.addEventListener("click", () => { this._clickHandler(); });
    }
}

export {ITADConnectionManager};
