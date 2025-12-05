import self_ from "./FSteamPeek.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FSteamPeek extends Feature<CApp> {

    private _moreLikeThis: HTMLElement|null = null;

    override async checkPrerequisites(): Promise<boolean> {
        this._moreLikeThis = document.querySelector(".related_items_ctn .page_content");
        return this._moreLikeThis !== null;
    }

    async apply(): Promise<void> {
        if (!this._moreLikeThis) {
            return;
        }

        new self_({
            target: this._moreLikeThis,
            anchor: this._moreLikeThis.firstElementChild ?? undefined,
            props: {
                user: this.context.user,
                language: this.context.language?.name ?? "english",
                appid: this.context.appid
            }
        });
    }

    private _adjustScroller() {
        DOMHelper.insertScript("scriptlets/Store/App/SteamPeek/adjustScroller.js");
    }
}
