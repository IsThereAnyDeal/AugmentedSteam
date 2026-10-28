import self_ from "./FBackToTop.svelte";
import Context from "@Content/Modules/Context/Context";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import {mount} from "svelte";

export default class FBackToTop extends Feature<Context> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.show_backtotop;
    }

    override async apply(): Promise<void> {
        mount(self_, {
            target: document.body,
            props: {
                target: document.querySelector<HTMLElement>("#StoreTemplate,#CommunityTemplate") ?? undefined
            }
        });
    }

}