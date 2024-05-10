import type Context from "@Content/Modules/Context/Context";

export default class Feature<C extends Context> {

    public constructor(
        protected context: C,
    ) {}

    public checkPrerequisites(): boolean|Promise<boolean> {
        return true;
    }

    public apply(): void|Promise<void> {
        throw new Error("Stub");
    }

    protected logError(err: unknown, msg: unknown, ...args: unknown[]): void {
        console.group(this.constructor.name);
        console.error(msg, ...args);
        console.error(err);
        console.groupEnd();
    }
}
