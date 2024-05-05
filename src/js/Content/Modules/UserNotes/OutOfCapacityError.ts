
export default class OutOfCapacityError extends Error {

    public ratio: number;

    constructor(ratio: number, message: string|undefined = undefined) {
        super(message);

        this.name = "OutOfCapacityError";
        this.ratio = ratio;
    }
}
