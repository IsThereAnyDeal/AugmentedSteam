import self_ from "./FOwnedElsewhere.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import ITADApiFacade from "@Content/Facades/ITADApiFacade";
import Settings from "@Options/Data/Settings";
import { mount } from "svelte";
import {MountTargetError} from "@Core/Errors/Errors";

export default class FOwnedElsewhere extends Feature<CApp> {

    override async isEnabled(): Promise<boolean> {
        return (!this.context.isOwned || !Settings.collection_banner_notowned)
            && await ITADApiFacade.isConnected();
    }

    override async apply(): Promise<string|null> {
        const response = await ITADApiFacade.getFromCollection(this.context.storeid);
        if (response === null) {
            return null;
        }

        const node = document.querySelector<HTMLElement>(".queue_overflow_ctn")!;
        if (!node) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: node.parentElement!,
            anchor: node.nextElementSibling!,
            props: {
                appName: this.context.appName,
                copies:  response
            }
        });
        return null;
    }
}
