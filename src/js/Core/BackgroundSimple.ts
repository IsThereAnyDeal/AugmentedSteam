import browser from "webextension-polyfill";
import ErrorParser from "@Core/Errors/ErrorParser";

type EventListener = () => void;
type ErrorEventListener = (name: string|null, message: string|null) => void;

class ListenerMap<T> {
    private counter: number = 0;
    protected readonly listeners: Map<number, T> = new Map();

    subscribe(listener: T): () => void {
        const id = this.counter++;
        this.listeners.set(id, listener);
        return () => this.listeners.delete(id);
    }
}

class EventListenerMap extends ListenerMap<EventListener> {
    notify(): void {
        this.listeners.forEach(listener => listener());
    }
}

class ErrorEventListenerMap extends ListenerMap<ErrorEventListener>{
    notify(name: string|null, message: string|null): void {
        this.listeners.forEach(listener => listener(name, message));
    }
}

export default class BackgroundSender {

    public static readonly onStart = new EventListenerMap();
    public static readonly onDone = new EventListenerMap();
    public static readonly onError = new ErrorEventListenerMap();

    static send2<Response>(action: string, params: Record<string, any>={}): Promise<Response> {
        this.onStart.notify();
        try {
            const result = browser.runtime.sendMessage({action, params});
            this.onDone.notify();
            return result;
        } catch(e: any) {
            const error = ErrorParser.parse(e.message ?? "");
            const {name, msg} = error;
            this.onError.notify(name, msg);
            throw e;
        }
    }
}
