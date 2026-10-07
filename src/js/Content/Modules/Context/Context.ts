import type Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";

export class ContextParams {
    constructor(
        public language: Language|null,
        public user: UserInterface
    ) {}
}

export default class Context {
    #params: ContextParams;

    constructor(params: ContextParams) {
        this.#params = params;
    }

    get language(): Language|null {
        return this.#params.language
    }

    get user(): UserInterface {
        return this.#params.user;
    }
}
