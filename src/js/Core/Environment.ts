export enum ContextType {
    Unknown,
    Background,
    ContentScript,
    Options,
    Offscreen
}

export default class Environment {

    private static currentContext: ContextType = ContextType.Unknown;

    public static set CurrentContext(context: ContextType) {
        this.currentContext = context;
    }

    static isBackgroundScript(): boolean {
        return this.currentContext === ContextType.Background;
    }

    static isContentScript(): boolean {
        return this.currentContext === ContextType.ContentScript;
    }

    static isOptions(): boolean {
        return this.currentContext === ContextType.Options;
    }
}
