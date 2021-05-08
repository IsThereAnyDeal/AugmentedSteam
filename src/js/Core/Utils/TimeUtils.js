class Timer {

    constructor(duration) {
        this._promise = new Promise(resolve => {
            this._id = setTimeout(() => { resolve(); }, duration);
        });
    }

    then(onSuccess, onFail) {
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

class ResettableTimer {

    constructor(onDone, duration) {
        this.onDone = onDone;
        this.duration = duration;

        this.reset();
    }

    get running() { return this._running; }

    reset() {
        if (typeof this._id !== "undefined") {
            clearTimeout(this._id);
        }

        this._id = setTimeout(async() => {
            await this.onDone();
            this._running = false;
        }, this.duration);

        this._running = true;
    }
}

class TimeUtils {

    static timer(duration) {
        return new Timer(duration);
    }

    static resettableTimer(onDone, duration) {
        return new ResettableTimer(onDone, duration);
    }

    static now() {
        return Math.trunc(Date.now() / 1000);
    }
}

export {TimeUtils};
