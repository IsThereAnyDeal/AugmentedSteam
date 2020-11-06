
class Debug {

    static async executionTime(fn, label) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.debug("Took", end - start, "ms to execute", label);
        return result;
    }
}

export {Debug};
