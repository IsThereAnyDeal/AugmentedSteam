import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import HighlightsTagsUtils2, {EHighlightStyle, type ItemSetup} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
import AppId from "@Core/GameId/AppId";

export default class FWishlistHighlights extends Feature<CWishlist> {

    // @ts-expect-error
    private highlighter: HighlightsTagsUtils2;

    // @ts-expect-error
    private map: Map<string, ItemSetup>;

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn; // TODO ITAD status
    }

    override async apply(): Promise<void> {
        const isMyWishlist = this.context.isMyWishlist;

        this.highlighter = new HighlightsTagsUtils2({
            wishlisted: !isMyWishlist,
            waitlisted: !isMyWishlist
        });
        if (!this.highlighter.isEnabled()) {
            return;
        }

        const appids = this.context.wishlistData?.map(entry => new AppId(entry.appid)) ?? [];

        if (appids.length === 0) {
            return;
        }

        this.highlighter.insertStyles();
        this.map = await this.highlighter.query(appids);

        this.context.dom.onUpdate.subscribe(() => this.highlight(), true);
    }

    private highlight(): void {
        const dom = this.context.dom.dom;

        for (const game of dom.gameList?.games ?? []) {
            const appid = game.appid;
            if (!game.appid) {
                continue;
            }

            const setup = this.map.get(appid!.string);

            if (setup?.h) {
                this.highlighter.highlight(setup.h, EHighlightStyle.BgGradient, game.node);
            }

            if (setup?.t && game.title?.node) {
                this.highlighter.tags(setup.t, game.title.node);
            }
        }

        this.highlighter.clearDisconnectedTags();
    }
}
