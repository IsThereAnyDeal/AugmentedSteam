import {BackgroundSimple} from "../../Modules/Core/BackgroundSimple";
import {ErrorParser} from "../../Modules/Core/Errors/ErrorParser";

export class Background extends BackgroundSimple {
    static async message(message) {
        ProgressBar.startRequest();

        let result;
        try {
            result = await super.message(message);
            ProgressBar.finishRequest();
            return result;
        } catch (err) {
            const errObj = ErrorParser.parse(err.message);

            switch (errObj.name) {
                case "ServerOutageError":
                    ProgressBar.serverOutage();
                    break;
                default: {
                    if (!Background._errorHandlers.some(handler => handler(errObj))) {
                        ProgressBar.failed();
                    }
                }
            }
            throw err;
        }
    }

    /**
     * @callback registerErrorHandlerCallback
     * @param {string} name - The error name
     * @param {string} msg - The error message
     * @returns {boolean} - Whether the error has been handled
     */

    /**
     * @param {registerErrorHandlerCallback} - The callback that will (eventually) handle the error
     */
    static registerErrorHandler(handler) {
        Background._errorHandlers.push(handler);
    }
}
Background._errorHandlers = [];
