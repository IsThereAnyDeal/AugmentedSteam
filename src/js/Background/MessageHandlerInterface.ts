import type {Unrecognized} from "@Background/background";
import {type Tabs} from "webextension-polyfill";

export default interface MessageHandlerInterface {
    handle(message: any, tab: Tabs.Tab|undefined): typeof Unrecognized|Promise<any>;
}
