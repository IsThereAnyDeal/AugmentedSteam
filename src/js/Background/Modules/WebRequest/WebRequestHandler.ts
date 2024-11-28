import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import {EAction} from "@Background/EAction";
import {Unrecognized} from "@Background/background";
import browser, {type Tabs, type WebRequest, webRequest} from "webextension-polyfill";

type OnCompleteCallback = (request: WebRequest.OnCompletedDetailsType) => Promise<void>;

export default class WebRequestHandler implements MessageHandlerInterface {

    /**
     * Map of listeners by tab id => key => callback
     */
    private listeners: Map<number, Map<string, OnCompleteCallback>> = new Map;

    private unregister(tabid: number) {
        console.log(`Unregister webrequest listeners for tab ${tabid}, tab no longer exists`);
        const current: Map<string, OnCompleteCallback> = this.listeners.get(tabid) ?? new Map;
        for (const listener of current.values()) {
            webRequest.onCompleted.removeListener(listener);
        }
        this.listeners.delete(tabid);
    }

    private async register(tabid: number, key: string, urls: string[]): Promise<void> {
        const callback = async (request: WebRequest.OnCompletedDetailsType): Promise<void> => {
            try {
                await browser.tabs.get(tabid);
            } catch {
                this.unregister(tabid);
                return;
            }

            browser.tabs.sendMessage(tabid, {
                key,
                url: request.url
            });
        }

        const current: Map<string, OnCompleteCallback> = this.listeners.get(tabid) ?? new Map();
        if (!current.has(key)) {
            current.set(key, callback);
            this.listeners.set(tabid, current);

            webRequest.onCompleted.addListener(callback, {urls});
        }
    }

    handle(message: any, tab: Tabs.Tab): typeof Unrecognized|Promise<any> {
        if (!tab.id) {
            throw new Error("Requires tab");
        }

        switch(message.action) {
            case EAction.Listener_Register:
                return this.register(tab.id, message.params.key, message.params.urls);
        }

        return Unrecognized;
    }
}
