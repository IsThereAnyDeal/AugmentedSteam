import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import {EAction} from "@Background/EAction";
import {Unrecognized} from "@Background/background";
import browser, {type Tabs, type WebRequest, webRequest} from "webextension-polyfill";

export default class WebRequestHandler implements MessageHandlerInterface {

    /**
     * Map of listeners by tab id
     */
    private listeners: Map<number, any[]> = new Map;

    private unregister(tabid: number) {
        console.log(`Unregister webrequest listeners for tab ${tabid}, tab no longer exists`);
        const current = this.listeners.get(tabid) ?? [];
        for (let listener of current) {
            webRequest.onCompleted.removeListener(listener);
        }
        this.listeners.delete(tabid);
    }

    private async register(tabid: number, urls: string[]): Promise<void> {
        const callback = async (request: WebRequest.OnCompletedDetailsType) => {
            try {
                await browser.tabs.get(tabid);
            } catch {
                this.unregister(tabid);
                return;
            }

            browser.tabs.sendMessage(tabid, {
                action: "webrequest.complete",
                url: request.url
            });
        }

        const current = this.listeners.get(tabid) ?? [];
        current.push(callback);

        webRequest.onCompleted.addListener(callback, {urls});
    }

    handle(message: any, tab: Tabs.Tab): typeof Unrecognized|Promise<any> {
        if (!tab.id) {
            throw new Error("Requires tab");
        }

        switch(message.action) {
            case EAction.Listener_Register:
                return this.register(tab.id, message.params.urls);
        }

        return Unrecognized;
    }
}
