import {BackgroundSimple} from "../../Core/BackgroundSimple";
import {Localization} from "../../Core/Localization/Localization";
import {Permissions} from "../../Core/Permissions";

class ITADConnectionManager {

    constructor() {
        const [itadStatus, itadAction] = document.querySelectorAll(".js-itad-status, .js-itad-action");
        this._itadStatus = itadStatus;
        this._itadAction = itadAction;
    }

    async _disconnect() {
        await BackgroundSimple.action("itad.disconnect");

        this._itadStatus.textContent = Localization.str.disconnected;
        this._itadStatus.classList.add("itad-status--disconnected");
        this._itadStatus.classList.remove("itad-status--connected");

        this._itadAction.textContent = Localization.str.connect;
        this._itadAction.removeEventListener("click", () => { this._disconnect(); });
        this._itadAction.addEventListener("click", () => { this._connect(); });
    }

    async _connect() {

        // Has to be synchronously acquired from a user gesture
        if (!await Permissions.requestOption("itad_connect")) { return; }
        await BackgroundSimple.action("itad.authorize");
        await Permissions.removeOption("itad_connect");

        this._itadStatus.textContent = Localization.str.connected;
        this._itadStatus.classList.add("itad-status--connected");
        this._itadStatus.classList.remove("itad-status--disconnected");

        this._itadAction.textContent = Localization.str.disconnect;
        this._itadAction.removeEventListener("click", () => { this._connect(); });
        this._itadAction.addEventListener("click", () => { this._disconnect(); });
    }

    async run() {

        if (await BackgroundSimple.action("itad.isconnected")) {
            this._itadStatus.textContent = Localization.str.connected;
            this._itadStatus.classList.add("itad-status--connected");

            this._itadAction.textContent = Localization.str.disconnect;
            this._itadAction.addEventListener("click", () => { this._disconnect(); });
        } else {
            this._itadStatus.textContent = Localization.str.disconnected;
            this._itadStatus.classList.add("itad-status--disconnected");

            this._itadAction.textContent = Localization.str.connect;
            this._itadAction.addEventListener("click", () => { this._connect(); });
        }
    }
}

export {ITADConnectionManager};
