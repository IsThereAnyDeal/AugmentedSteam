
class Timer {

    private promise: Promise<void>;

    constructor(duration: number) {
        this.promise = new Promise(resolve => setTimeout(resolve, duration));
    }

    then(onDone: (value: void) => void|Promise<void>) {
        return this.promise.then(onDone);
    }
}

export interface IResettableTimer {
    readonly running: boolean,
    reset: () => void,
    stop: () => void,
}

class ResettableTimer implements IResettableTimer {

    private id: number|undefined;
    private _running: boolean = false;

    private readonly callback: () => void|Promise<void>;
    private readonly duration: number;

    constructor(callback: () => void|Promise<void>, duration: number) {
        this.callback = callback;
        this.duration = duration;

        this.reset();
    }

    get running(): boolean {
        return this._running;
    }

    reset(): void {
        if (typeof this.id !== "undefined") {
            clearTimeout(this.id);
        }

        this.id = setTimeout(async() => {
            await this.callback();
            this._running = false;
        }, this.duration);

        this._running = true;
    }

    stop(): void {
        if (typeof this.id !== "undefined") {
            clearTimeout(this.id);
            this.id = undefined;
        }

        this._running = false;
    }
}


export default class TimeUtils {

    static timer(duration: number): Timer {
        return new Timer(duration);
    }

    static resettableTimer(callback: () => void|Promise<void>, duration: number): IResettableTimer {
        return new ResettableTimer(callback, duration);
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
