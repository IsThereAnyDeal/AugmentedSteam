import {Messenger} from "../common";

export class ExtensionLayer {

    /*
     * NOTE: use cautiously!
     * Run script in the context of the current tab
     */
    static runInPageContext(fun, args, withPromise) {
        const script = document.createElement("script");
        let promise;
        const argsString = Array.isArray(args) ? JSON.stringify(args) : "[]";

        if (withPromise) {
            const msgId = `msg_${ExtensionLayer._msgCounter++}`;
            promise = Messenger.onMessage(msgId);
            script.textContent = `(async () => { Messenger.postMessage("${msgId}", await (${fun})(...${argsString})); })();`;
        } else {
            script.textContent = `(${fun})(...${argsString});`;
        }

        document.documentElement.appendChild(script);
        script.parentNode.removeChild(script);
        return promise;
    }
}
ExtensionLayer._msgCounter = 0;
