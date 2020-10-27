
class TimeUtils {

    static sleep(duration) {
        return new Promise((resolve => {
            setTimeout(() => { resolve(); }, duration);
        }));
    }

    static now() {
        return Math.trunc(Date.now() / 1000);
    }
}

export {TimeUtils};
