import Settings, {SettingsStore} from "@Options/Data/Settings";
import DOMPurify, {type Config} from "dompurify";

let initialized = false;

/**
 * DOMPurify setup
 * @see https://github.com/cure53/DOMPurify
 */
export default async function() {

    if (initialized) { return; }
    initialized = true;

    await SettingsStore.init();
    const allowOpenInNewTab = Settings.openinnewtab;

    /*
     * NOTE FOR ADDON REVIEWER:
     * We are modifying default DOMPurify settings to allow other protocols in URLs
     * and to allow links to safely open in new tabs.
     *
     * We took the original Regex and added chrome-extension://, moz-extension:// and steam://
     * First two are needed for linking local resources from extension,
     * steam:// protocol is used by Steam store to open their own client (e.g. when you want to launch a game).
     *
     * The addition of the `target` attribute to the allowed attributes is done in order to be able to open links in a new tab.
     * We only allow target="_blank" while adding rel="noreferrer noopener" to prevent child window to access window.opener
     * as described in https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
     */

    const purifyConfig: Config = {
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
