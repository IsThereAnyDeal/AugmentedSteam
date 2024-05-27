export type CustomizerSetup = Array<[
    string,                  // name
    string|HTMLElement|null, // selector/targets
]|[
    string,                  // name
    string|HTMLElement|null, // selector/targets
    string|undefined,        // label
]|[
    string,                  // name
    string|HTMLElement|null, // selector/targets
    string|undefined,        // label
    boolean|undefined        // forceShow
]>;
