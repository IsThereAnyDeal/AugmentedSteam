import HTMLParser from "@Core/Html/HtmlParser";
import type {IResettableTimer} from "@Core/Utils/TimeUtils";
import TimeUtils from "@Core/Utils/TimeUtils";
import FAlternativeLinuxIcon from "../Common/FAlternativeLinuxIcon";
import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FEmptyWishlist from "./FEmptyWishlist";
import FExportWishlist from "./FExportWishlist";
import FKeepEditableRanking from "./FKeepEditableRanking";
import FWishlistProfileLink from "./FWishlistProfileLink";
import CStoreBase from "@Content/Features/Store/Common/CStoreBase";
import ContextType from "@Content/Modules/Context/ContextType";
import ASEventHandler from "@Content/Modules/ASEventHandler";
import type {ContextParams} from "@Content/Modules/Context/Context";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

export interface WishlistEntry {
    appid: number,
    priority: number,
    added: number
}

export default class CWishlist extends CStoreBase {

    public readonly onWishlistUpdate: ASEventHandler<HTMLElement[]> = new ASEventHandler<HTMLElement[]>();

    private readonly hasWishlistData: boolean = false;
    public wishlistData: WishlistEntry[]|undefined;
    public myWishlist: boolean = false;
    public ownerId: string|undefined;

    constructor(params: ContextParams) {
        super(params, ContextType.WISHLIST, [
                FAlternativeLinuxIcon,
                FWishlistHighlights,
                // FWishlistITADPrices,
                // FWishlistUserNotes,
                FWishlistStats,
                // FEmptyWishlist,
                FExportWishlist,
                // FKeepEditableRanking,
                FWishlistProfileLink,
            ]
        );
        return;

        // TODO use SteamFacade to get global variable?
        const wishlistData = HTMLParser.getArrayVariable<WishlistEntry>("g_rgWishlistData") ?? [];

        const hasWishlistData = wishlistData && wishlistData.length > 0;

        super(params, ContextType.WISHLIST, hasWishlistData
            ? [
                FAlternativeLinuxIcon,
                // FWishlistHighlights,
                // FWishlistITADPrices,
                // FWishlistUserNotes,
                // FWishlistStats,
                // FEmptyWishlist,
                // FExportWishlist,
                // FKeepEditableRanking,
                FWishlistProfileLink,
            ] : []
        );

        this.hasWishlistData = hasWishlistData;
        if (!this.hasWishlistData) {
            return;
        }

        this.wishlistData = wishlistData;
        this.myWishlist = false;

        if (this.user.isSignedIn) {
            const myWishlistUrl = this.user.profileUrl.replace("steamcommunity.com/", "store.steampowered.com/wishlist/").replace(/\/$/, "");
            const myWishlistUrlRegex = new RegExp(`^${myWishlistUrl}([/#]|$)`);
            this.myWishlist = myWishlistUrlRegex.test(window.location.href) || window.location.href.includes(`/profiles/${this.user.steamId}`);
        }

        // Maintain the order of the buttons
        this.dependency(FEmptyWishlist, [FExportWishlist, true]);
    }

    override async applyFeatures(): Promise<void> {

        const queryData: {
            queries: Array<{
                state: Record<string, any>,
                queryKey: Array<any>
            }>
        } = JSON.parse(await SteamFacade.global("SSR.renderContext.queryData"));

        for (let query of queryData.queries) {
            if (query.queryKey[0] === "WishlistSortedFiltered") {
                this.ownerId = query.state.data.steamid;
                this.wishlistData = query.state.data.items;
            }
        }

        if (!this.ownerId || !this.wishlistData) {
            throw new Error();
        }

        this.myWishlist = this.ownerId === this.user.steamId;

        super.applyFeatures();
        return;

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
