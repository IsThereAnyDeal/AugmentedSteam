import type Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";
import {EBootstrapMode} from "@Content/bootstrap";

export class ContextParams {
    constructor(
        public mode: EBootstrapMode,
        public language: Language|null,
        public user: UserInterface
    ) {}
}

export default class Context {
    #params: ContextParams;

    constructor(params: ContextParams) {
        this.#params = params;
    }

    get isReact(): boolean {
        return this.#params.mode === EBootstrapMode.React;
    }

    get language(): Language|null {
        return this.#params.language
    }

    get user(): UserInterface {
        return this.#params.user;
    }
}
