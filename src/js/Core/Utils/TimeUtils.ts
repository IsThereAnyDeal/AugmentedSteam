
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

    private readonly onDone: () => void|Promise<void>;
    private readonly duration: number;

    constructor(onDone: () => void|Promise<void>, duration: number) {
        this.onDone = onDone;
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

        this.id = window.setTimeout(async() => {
            await this.onDone();
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

    static resettableTimer(onDone: () => void|Promise<void>, duration: number): IResettableTimer {
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
