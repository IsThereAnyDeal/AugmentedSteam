import type {Unrecognized} from "@Background/background";

export default interface MessageHandlerInterface {
    handle(message: any): typeof Unrecognized|Promise<any>;
}
