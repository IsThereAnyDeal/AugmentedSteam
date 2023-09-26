type ParsedError = {
    name: string;
    msg: string;
};

/**
 * Convenience function for passing errors between contexts.
 * Errors thrown in the context of a message callback on the background page are
 * {@link https://github.com/mozilla/webextension-polyfill/blob/87bdfa844da054d189ac28423cf01b64ebfe1e5b/src/browser-polyfill.js#L418 cut down to only send the message of the error},
 * losing information about the type.
 *
 * Takes an {@linkcode Error} string and parses it by splitting it into name and message
 * @param {String} errStr a string created by {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/toString Error.prototype.toString}
 * @returns an object containing information about the error name and its message
 */
function parse(errStr: string): ParsedError {
    const info = /(.*):\s(.+)/.exec(errStr);

    return {"name": info?.[1] ?? "", "msg": info?.[2] ?? ""};
}

export {
    parse as default,
    type ParsedError,
};
