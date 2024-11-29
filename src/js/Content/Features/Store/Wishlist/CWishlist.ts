import FAlternativeLinuxIcon from "../Common/FAlternativeLinuxIcon";
import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FEmptyWishlist from "./FEmptyWishlist";
import FExportWishlist from "./FExportWishlist";
import FKeepEditableRanking from "./FKeepEditableRanking";
import FWishlistProfileLink from "./FWishlistProfileLink";
import ContextType from "@Content/Modules/Context/ContextType";
import ASEventHandler from "@Content/Modules/ASEventHandler";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import {WishlistDOM} from "@Content/Features/Store/Wishlist/Utils/WishlistDOM";
import WebRequestListener from "@Content/Modules/WebRequest/WebRequestListener";
import ServiceFactory from "@Protobufs/ServiceFactory";
import Long from "long";

export interface WishlistEntry {
    appid: number,
    priority: number,
    added: number
}

export default class CWishlist extends Context {

    public readonly onReorder: ASEventHandler<void> = new ASEventHandler<void>();

    public readonly dom: WishlistDOM;
    public readonly ownerId: string;

    public wishlistData: WishlistEntry[];

    static override async create(params: ContextParams): Promise<CWishlist> {

        const queryData: {
            queries: Array<{
                state: Record<string, any>,
                queryKey: Array<any>
            }>
        } = JSON.parse(await SteamFacade.global("SSR.renderContext.queryData"));

        let ownerId: string|null = null;
        let wishlistData: WishlistEntry[]|null = null;

        for (let query of queryData.queries) {
            if (query.queryKey[0] === "WishlistSortedFiltered") {
                ownerId = query.state.data.steamid;
                wishlistData = query.state.data.items;
            }
        }

        if (!ownerId || !wishlistData) {
            throw new Error("Couldn't initialize wishlist, didn't find owner");
        }

        return new CWishlist(params, ownerId, wishlistData);
    }

    /* TODO private */ constructor(params: ContextParams, ownerId: string, wishlistData: WishlistEntry[]) {
        super(params, ContextType.WISHLIST, [
            FAlternativeLinuxIcon,
            FWishlistHighlights,
            FWishlistITADPrices,
            FWishlistUserNotes,
            FWishlistStats,
            FEmptyWishlist,
            FExportWishlist,
            FKeepEditableRanking,
            FWishlistProfileLink,
        ]);

        this.ownerId = ownerId;
        this.wishlistData = wishlistData;
        this.dom = new WishlistDOM();

        WebRequestListener.onComplete("reorder", ["https://store.steampowered.com/wishlist/action/reorder"],
            async (_url: string) => {
                await this.reloadWishlistData();
                this.onReorder.dispatch();
            });

        this.dom.observe();
    }

    public get isMyWishlist(): boolean {
        return this.ownerId === this.user.steamId;
    }

    private async reloadWishlistData(): Promise<void> {
        const wishlist = await ServiceFactory.WishlistService(this.user).getWishlist({
            steamid: Long.fromString(this.ownerId!)
        });
        this.wishlistData = wishlist.items.map(item => {
            return {
                appid: item.appid!,
                priority: item.priority!,
                added: item.dateAdded!
            }
        });
    }
}
