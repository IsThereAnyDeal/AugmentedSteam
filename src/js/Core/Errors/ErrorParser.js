
/**
 * Convenience class for passing errors between contexts.
 * Errors thrown in the context of a message callback on the background page are
 * {@link https://github.com/mozilla/webextension-polyfill/blob/87bdfa844da054d189ac28423cf01b64ebfe1e5b/src/browser-polyfill.js#L418
 *  cut down to only send the message of the error},
 * losing information about the type.
 */
class ErrorParser {

    /**
     * Takes an Error string and parses it by splitting it into name and message
     * @param {String} errStr a string created by Error.prototype.toString
     * @returns {{name: String, msg: String}} an object containing information about the error name and its message
     */
    static parse(errStr) {
        const info = errStr.match(/(.*):\s(.+)/);

        return {"name": info[1] || "", "msg": info[2] || ""};
    }
}

export {ErrorParser};
