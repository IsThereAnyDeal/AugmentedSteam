import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";
import DOMHelper from "@Content/Modules/DOMHelper";
import type Context from "@Content/Modules/Context/Context";

export default class FRemoveBroadcasts extends Feature<Context> {

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.removebroadcasts;
    }

    override async apply(): Promise<void> {
        const observer = new MutationObserver(() => {
            const broadcastNode = document.querySelector("[data-featuretarget=broadcast-embed],.SaleBroadcastSection_trgt");
            if (!broadcastNode) {
                return;
            }

            console.log("Removing broadcast");
            broadcastNode.remove();
            DOMHelper.insertScript("scriptlets/Store/App/stopBroadcast.js");
            
            // observer.disconnect(); // can't disconnect, because on react pages hydration would add broadcast back
        });
        observer.observe(document.body, {
            subtree: true,
            childList: true,
        });
    }
}
