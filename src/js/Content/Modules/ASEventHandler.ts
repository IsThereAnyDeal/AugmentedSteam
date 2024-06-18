
export type ASEvent<T> = {data: T};
export type ASEventListener<T> = (e: ASEvent<T>) => void;

export default class ASEventHandler<T = void> {

    private readonly listeners: ASEventListener<T>[] = [];
    private wasDispatched: boolean = false;
    private data: T|undefined;

    public subscribe(listener: ASEventListener<T>): void {
        this.listeners.push(listener);

        if (this.wasDispatched) {
            this.invoke(listener);
        }
    }

    private invoke(listener: ASEventListener<T>) {
        listener({data: this.data!});
    }

    public dispatch(data: T): void {
        this.data = data;

        for (let listener of this.listeners) {
            this.invoke(listener);
        }

        this.wasDispatched = true;
    }
}
