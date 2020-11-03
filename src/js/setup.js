import DOMPurify from "dompurify";
import {SyncedStorage} from "./Core/Storage/SyncedStorage";

/*
 * Shim for Promise.finally() for browsers (Waterfox/FF 56) that don't have it
 * https://github.com/domenic/promises-unwrapping/issues/18#issuecomment-57801572
 */
if (typeof Promise.prototype.finally === "undefined") {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Promise.prototype, "finally", {
        "value": function(callback) {
            const constructor = this.constructor;
            return this.then((value) => {
                return constructor.resolve(callback()).then(() => {
                    return value;
                });
            }, (reason) => {
                return constructor.resolve(callback()).then(() => {
                    console.error(reason);
                    throw reason;
                });
            });
        },
    });
}

let initialized = false;

/**
 * DOMPurify setup
 * @see https://github.com/cure53/DOMPurify
 */
export default function() {

    if (initialized) { return; }
    initialized = true;

    const allowOpenInNewTab = SyncedStorage.get("openinnewtab");

    /*
     * NOTE FOR ADDON REVIEWER:
     * We are modifying default DOMPurify settings to allow other protocols in URLs
     * and to allow links to safely open in new tabs.
     *
     * We took the original Regex and aded chrome-extension://, moz-extension:// and steam://
     * First two are needed for linking local resources from extension,
     * steam:// protocol is used by Steam store to open their own client (e.g. when you want to launch a game).
     *
     * The addition of the `target` attribute to the allowed attributes is done in order to be able to open links in a new tab.
     * We only allow target="_blank" while adding rel="noreferrer noopener" to prevent child window to access window.opener
     * as described in https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
     */

    const purifyConfig = {
        "ALLOWED_URI_REGEXP": /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|chrome-extension|moz-extension|steam):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
    };

    if (allowOpenInNewTab) {
        purifyConfig.ADD_ATTR = ["target"];

        DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
            if (data.attrName === "target") {
                if (data.attrValue === "_blank") {
                    node.setAttribute("rel", "noreferrer noopener");
                } else {
                    data.keepAttr = false;
                }
            }
        });
    }

    DOMPurify.setConfig(purifyConfig);
}
