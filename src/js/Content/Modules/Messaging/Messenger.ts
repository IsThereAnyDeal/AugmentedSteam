import type {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";

export default class Messenger {

    private static id: number = 0;

    static call(handler: MessageHandler, action: string, params: any[]=[]): void {
        document.dispatchEvent(new CustomEvent(handler, {detail: {action, params}}));
    }

    static get<T>(handler: MessageHandler, action: string, params: any[]=[]): Promise<T> {
        return new Promise(resolve => {
            const id = `as_msg_${this.id++}`;

            // @ts-ignore
            window.addEventListener(id, (e) => resolve(e.detail), {once: true});
            document.dispatchEvent(new CustomEvent(handler, {detail: {action, params, id}}));
        });
    }
}
