import type Context from "@Content/Modules/Context/Context";

export default abstract class Feature<C extends Context> {

    public constructor(
        protected context: C
    ) {}

    public abstract checkPrerequisites(): Promise<boolean>;
    public abstract apply(): Promise<void>;

    protected logError(err: unknown, msg: unknown, ...args: unknown[]): void {
        console.group(this.constructor.name);
        console.error(msg, ...args);
        console.error(err);
        console.groupEnd();
    }
}
