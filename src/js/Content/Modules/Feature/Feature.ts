class Feature<C extends object = Record<string, never>> {

    public constructor(
        protected context: C,
    ) {}

    public checkPrerequisites(): boolean {
        return true;
    }

    public apply(): void {
        throw new Error("Stub");
    }

    protected logError(err: unknown, msg: unknown, ...args: unknown[]): void {
        console.group(this.constructor.name);
        console.error(msg, ...args);
        console.error(err);
        console.groupEnd();
    }
}

export {Feature};
