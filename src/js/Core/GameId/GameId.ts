
export default abstract class GameId {

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
