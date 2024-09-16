import HTMLParser from "@Core/Html/HtmlParser";
import TimeUtils from "@Core/Utils/TimeUtils";
import type {IResettableTimer} from "@Core/Utils/TimeUtils";
import FAlternativeLinuxIcon from "../Common/FAlternativeLinuxIcon";
import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FWishlistActionButtons from "./FWishlistActionButtons";
import FKeepEditableRanking from "./FKeepEditableRanking";
import FOneClickRemoveFromWishlist from "./FOneClickRemoveFromWishlist";
import FWishlistProfileLink from "./FWishlistProfileLink";
import CStoreBase from "@Content/Features/Store/Common/CStoreBase";
import ContextType from "@Content/Modules/Context/ContextType";
import User from "@Content/Modules/User";
import ASEventHandler from "@Content/Modules/ASEventHandler";

export interface WishlistEntry {
    appid: number,
    priority: number,
    added: number
}

export default class CWishlist extends CStoreBase {

    public readonly onWishlistUpdate: ASEventHandler<HTMLElement[]> = new ASEventHandler<HTMLElement[]>();

    private readonly hasWishlistData: boolean = false;
    public readonly wishlistData: WishlistEntry[] = [];
    public readonly myWishlist: boolean = false;

    constructor() {
        // TODO use SteamFacade to get global variable?
        const wishlistData = HTMLParser.getArrayVariable<WishlistEntry>("g_rgWishlistData") ?? [];

        const hasWishlistData = wishlistData && wishlistData.length > 0;

        super(ContextType.WISHLIST, hasWishlistData
            ? [
                FAlternativeLinuxIcon,
                FWishlistHighlights,
                FWishlistITADPrices,
                FWishlistUserNotes,
                FWishlistStats,
                FWishlistActionButtons,
                FKeepEditableRanking,
                FOneClickRemoveFromWishlist,
                FWishlistProfileLink,
            ] : []
        );

        this.hasWishlistData = hasWishlistData;
        if (!this.hasWishlistData) {
            return;
        }

        this.wishlistData = wishlistData;
        this.myWishlist = false;

        if (User.isSignedIn) {
            const myWishlistUrl = User.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
            const myWishlistUrlRegex = new RegExp(`^${myWishlistUrl}([/#]|$)`);
            this.myWishlist = myWishlistUrlRegex.test(window.location.href) || window.location.href.includes(`/profiles/${User.steamId}`);
        }
    }

    override async applyFeatures(): Promise<void> {
        if (!this.hasWishlistData) { return; }

        const throbber = document.getElementById("throbber");
        if (throbber && throbber.style.display !== "none") {
            await new Promise<void>(resolve => {
                new MutationObserver((_, observer) => {
                    observer.disconnect();
                    resolve();
                }).observe(throbber, {"attributes": true});
            });
        }

        await super.applyFeatures();

        // Internal property to track which nodes have already been processed
        const done = Symbol("done");

        const alreadyLoaded = Array.from(document.querySelectorAll<HTMLElement>(".wishlist_row"));
        if (alreadyLoaded.length !== 0) {
            await this.triggerCallbacks(alreadyLoaded, done);
        }

        let timer: IResettableTimer|null = null;
        const delayedWork: Set<HTMLElement> = new Set();

        new MutationObserver(mutations => {

            for (const {addedNodes} of mutations) {
                const node = addedNodes[0] as HTMLElement;
                // @ts-expect-error
                if (node && !node[done]) {
                    delayedWork.add(node);
                }
            }

            if (timer === null) {

                timer = TimeUtils.resettableTimer(() => {

                    // Valve detaches wishlist entries that aren't visible
                    const visibleRows: HTMLElement[] = Array.from(delayedWork).filter(node => node.isConnected);
                    delayedWork.clear();

                    if (visibleRows.length !== 0) {
                        this.triggerCallbacks(visibleRows, done);
                    }
                }, 50);
            } else {
                timer.reset();
            }
        }).observe(document.getElementById("wishlist_ctn")!, {"childList": true});
    }

    triggerCallbacks(nodes: HTMLElement[], done: Symbol) {
        nodes.forEach(node => {
            // @ts-expect-error
            node[done] = true;
        });
        this.onWishlistUpdate.dispatch(nodes);
    }
}
