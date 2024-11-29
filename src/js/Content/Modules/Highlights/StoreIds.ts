
export abstract class StoreId {

    private readonly full: string;

    protected constructor(
        private type_: "app"|"sub"|"bundle",
        private id_: number
    ) {
        this.full = `${this.type_}/${this.id_}`;
    }

    get type(): "app"|"sub"|"bundle" {
        return this.type_;
    }

    get number(): number {
        return this.id_;
    }

    get string(): string {
        return this.full;
    };
}

export class Appid extends StoreId {
    constructor(id: number) {
        super("app", id);
    }
}

export class Subid extends StoreId {
    constructor(id: number) {
        super("app", id);
    }
}

export class Bundleid extends StoreId {
    constructor(id: number) {
        super("bundle", id);
    }
}