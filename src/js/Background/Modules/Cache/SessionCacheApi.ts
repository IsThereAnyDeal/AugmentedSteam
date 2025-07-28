import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import {EAction} from "@Background/EAction";
import {Unrecognized} from "@Background/background";

export default class SessionCacheApi implements MessageHandlerInterface{

    #storage = new Map<string, any>();

    private setValue(prefix: string, key: string, value: any): void {
        this.#storage.set(prefix+"/"+key, value);
    }

    private getValue(prefix: string, key: string): any {
        return this.#storage.get(prefix+"/"+key) ?? null;
    }

    handle(message: any): typeof Unrecognized|Promise<any> {

        switch (message.action) {
            case EAction.SessionCacheSet: {
                this.setValue(message.params.prefix, message.params.key, message.params.value);
                return Promise.resolve();
            }

            case EAction.SessionCacheGet: {
                return Promise.resolve(this.getValue(message.params.prefix, message.params.key));
            }
        }

        return Unrecognized;
    }
}
