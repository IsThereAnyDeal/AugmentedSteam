
export class Timer {

    private _id: number|undefined;
    private _promise: Promise<void>|null = null;

    constructor(duration: number) {
        this._promise = new Promise(resolve => {
            this._id = setTimeout(() => resolve(), duration);
        });
    }

    then(
        onSuccess: ((value: void) => PromiseLike<void>|void)|undefined|null,
        onFail: ((reason: any) => PromiseLike<never>)|undefined = undefined
    ) {
        if (this._promise) {
            return this._promise.then(onSuccess, onFail);
        }

        throw new Error("Timer has been cleared before");
    }

    clear() {
        clearTimeout(this._id);
        this._promise = null;
    }
}

export class ResettableTimer {

    private _id: number|undefined;
    private _running: boolean = false;

    private readonly onDone: () => void|Promise<void>;
    private readonly duration: number;

    constructor(onDone: () => void|Promise<void>, duration: number) {
        this.onDone = onDone;
        this.duration = duration;

        this.reset();
    }

    get running() {
        return this._running;
    }

    reset(): void {
        if (typeof this._id !== "undefined") {
            clearTimeout(this._id);
        }

        this._id = setTimeout(async() => {
            await this.onDone();
            this._running = false;
        }, this.duration);

        this._running = true;
    }

    stop() {
        if (typeof this._id !== "undefined") {
            clearTimeout(this._id);
        }

        this._running = false;
    }
}


export default class TimeUtils {

    static timer(duration: number): Timer {
        return new Timer(duration);
    }

    static resettableTimer(onDone: () => void|Promise<void>, duration: number): ResettableTimer {
        return new ResettableTimer(onDone, duration);
    }

    static now(): number {
        return Math.trunc(Date.now() / 1000);
    }

    static isInPast(timestamp: number): boolean {
        return timestamp <= this.now();
    }

    static isInFuture(timestamp: number): boolean {
        return timestamp > this.now();
    }
}
