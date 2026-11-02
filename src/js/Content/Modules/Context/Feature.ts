import type Context from "@Content/Modules/Context/Context";

export default abstract class Feature<C extends Context> {

    public constructor(
        protected context: C
    ) {}

    public abstract isEnabled(): Promise<boolean>;

    /**
     * Feature should throw if it can't be applied due to error.
     * You can return string to provide additional info to the user.
     *
     * String response may be useful if the feature was not applied when it didn't meet some requirements,
     * but did not explicitly fail. Sometimes it may be hard to distinguish this. If you check for a node on the page,
     * and that node is missing, there's no way to know if it's missing because the HTML structure has failed
     * or because it's just not there. Returning status message may help with determining what's going on.
     */
    public abstract apply(): Promise<string|null>;

    public get name(): string {
        return this.constructor.name;
    }

    protected logError(err: unknown, msg: unknown, ...args: unknown[]): void {
        console.group(this.constructor.name);
        console.error(msg, ...args);
        console.error(err);
        console.groupEnd();
    }
}
