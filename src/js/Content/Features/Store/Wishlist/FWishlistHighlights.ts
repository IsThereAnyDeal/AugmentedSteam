import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import HighlightsTagsUtils2, {EHighlightStyle, type ItemSetup} from "@Content/Modules/Highlights/HighlightsTagsUtils2";
import {Appid} from "@Content/Modules/Highlights/StoreIds";

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

        const appids = this.context.wishlistData?.map(entry => new Appid(entry.appid)) ?? [];

        if (appids.length === 0) {
            return;
        }

        this.highlighter.insertStyles();
        this.map = await this.highlighter.query(appids);

        this.context.dom.onChange(() => this.highlight());
        this.highlight()
    }

    private highlight(): void {
        const dom = this.context.dom;

        for (const node of dom.gameNodes()) {
            const a = dom.titleNode(node);
            if (!a) {
                continue;
            }

            const appid = this.context.dom.appid(a)!.string;
            const setup = this.map.get(appid);

            if (setup?.h) {
                this.highlighter.highlight(setup.h, EHighlightStyle.BgGradient, node);
            }

            if (setup?.t) {
                this.highlighter.tags(setup.t, a);
            }
        }

        this.highlighter.clearDisconnectedTags();
    }
}
