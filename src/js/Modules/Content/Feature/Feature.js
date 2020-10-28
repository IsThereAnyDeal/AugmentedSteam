
class Feature {

    constructor(context) {
        this.context = context;
    }

    checkPrerequisites() {
        return true;
    }

    apply() {
        throw new Error("Stub");
    }

    logError(err, msg, ...args) {
        console.group(this.constructor.name);
        console.error(msg, ...args);
        console.error(err);
        console.groupEnd();
    }
}

export {Feature};
