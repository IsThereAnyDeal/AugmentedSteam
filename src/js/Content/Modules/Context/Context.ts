import type Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";
import type {EBootstrapMode} from "@Content/bootstrap";

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

    get mode(): EBootstrapMode {
        return this.#params.mode;
    }

    get language(): Language|null {
        return this.#params.language
    }

    get user(): UserInterface {
        return this.#params.user;
    }
}
