import type {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class Messenger {

    private static id: number = 0;

    private static dispatchEvent(handler: MessageHandler, action: string, params: any[]=[], id: string|undefined=undefined): void {

        DOMHelper.insertScript("scriptlets/event.js", {handler, detail: {
            action, params, id
        }});
    }

    static call(handler: MessageHandler, action: string, params: any[]=[]): void {
        this.dispatchEvent(handler, action, params);
    }

    static get<T>(handler: MessageHandler, action: string, params: any[]=[]): Promise<T> {
        return new Promise(resolve => {
            const id = `as_msg_${this.id++}`;

            // @ts-ignore
            document.addEventListener(id, (e) => resolve(e.detail), {once: true});
            this.dispatchEvent(handler, action, params, id);
        });
    }
}
