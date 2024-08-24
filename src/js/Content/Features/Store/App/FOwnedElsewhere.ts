import self_ from "./FOwnedElsewhere.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
import Settings from "@Options/Data/Settings";

export default class FOwnedElsewhere extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        return (!this.context.isOwned || !Settings.collection_banner_notowned)
            && await ITADApiFacade.isConnected();
    }

    override async apply(): Promise<void> {
        const response = await ITADApiFacade.getFromCollection(this.context.storeid);
        if (response === null) {
            return;
        }

        const node = document.querySelector<HTMLElement>(".queue_overflow_ctn")!;

        new self_({
            target: node.parentElement!,
            anchor: node.nextElementSibling!,
            props: {
                appName: this.context.appName,
                copies:  response
            }
        });
    }
}
