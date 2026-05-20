import FAlternativeLinuxIcon from "../Common/FAlternativeLinuxIcon";
import FWishlistHighlights from "./FWishlistHighlights";
import FWishlistITADPrices from "./FWishlistITADPrices";
import FWishlistUserNotes from "./FWishlistUserNotes";
import FWishlistStats from "./FWishlistStats";
import FEmptyWishlist from "./FEmptyWishlist";
import FExportWishlist from "./FExportWishlist";
import ContextType from "@Content/Modules/Context/ContextType";
import Context, {type ContextParams} from "@Content/Modules/Context/Context";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import {WishlistDOM} from "@Content/Features/Store/Wishlist/Utils/WishlistDOM";
import type {TReactQueryData} from "@Content/Features/_types";
import FShowRanking from "@Content/Features/Store/Wishlist/FShowRanking";
import Long from "long";
import ServiceFactory from "@Protobufs/ServiceFactory";
import WebRequestListener from "@Content/Modules/WebRequest/WebRequestListener";
import ASEventHandler from "@Content/Modules/ASEventHandler";
import Settings from "@Options/Data/Settings";

export interface WishlistEntry {
    appid: number,
    priority: number,
    added: number,
}

export default class CWishlist extends Context {

    public readonly dom: WishlistDOM;
    public readonly ownerId: string;

    public wishlistData: WishlistEntry[];

    public readonly onReorder: ASEventHandler<void> = new ASEventHandler<void>();

    static override async create(params: ContextParams): Promise<CWishlist> {

        const queryData: TReactQueryData = JSON.parse(await SteamFacade.global("SSR.renderContext.queryData"));

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
            FShowRanking
        ]);

        this.ownerId = ownerId;
        this.wishlistData = wishlistData;
        this.dom = new WishlistDOM();

        if (Settings.show_wishlist_ranking && this.isMyWishlist) {
            WebRequestListener.onComplete("reorder", ["https://store.steampowered.com/wishlist/action"],
                async (_url: string) => {
                    await this.reloadWishlistData();
                    this.onReorder.dispatch();
                });
        }

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
