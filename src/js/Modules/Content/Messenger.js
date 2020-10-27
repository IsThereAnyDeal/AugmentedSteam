
/**
 * NOTE FOR ADDON REVIEWER:
 * This class is meant to simplify communication between extension context and page context.
 * Basically, we have wrapped postMessage API in this class.
 */
export class Messenger {
    static postMessage(msgID, info) {
        window.postMessage({
            "type": `es_${msgID}`,
            "information": info
        }, window.location.origin);
    }

    // Used for one-time events
    static onMessage(msgID) {
        return new Promise(resolve => {
            function callback(e) {
                if (e.source !== window) { return; }
                if (!e.data || !e.data.type) { return; }
                if (e.data.type === `es_${msgID}`) {
                    resolve(e.data.information);
                    window.removeEventListener("message", callback);
                }
            }
            window.addEventListener("message", callback);
        });
    }

    // Used for setting up a listener that should be able to receive more than one callback
    static addMessageListener(msgID, callback) {
        window.addEventListener("message", e => {
            if (e.source !== window) { return; }
            if (!e.data || !e.data.type) { return; }
            if (e.data.type === `es_${msgID}`) {
                callback(e.data.information);
            }
        });
    }
}
