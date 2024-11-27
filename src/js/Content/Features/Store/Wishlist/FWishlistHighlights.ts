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

    override async apply() {
        this.highlighter = new HighlightsTagsUtils2({
            wishlisted: !this.context.myWishlist,
            waitlisted: !this.context.myWishlist
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

        const observer = new MutationObserver(() => this.highlight());

        observer.observe(
            document.querySelector(".oI5QPBYWG8c-")!,
            {
                subtree: true,
                childList: true,
                characterData: true
            }
        )

        this.highlight()
    }

    private highlight(): void {
        const gameNodes = document.querySelectorAll<HTMLElement>(".LSY1zV2DJSM-");
        for (let node of gameNodes) {

            // title node
            const a = node.querySelector<HTMLAnchorElement>("a.Fuz2JeT4RfI-[href*='/app/']");
            if (!a) {
                continue;
            }

            const m = a.href.match(/app\/(\d+)/)!;
            const appid = m[0];
            const setup = this.map.get(appid);

            if (setup?.h) {
                this.highlighter.highlight(setup.h, EHighlightStyle.BgGradient, node);
            }

            if (setup?.t) {
                this.highlighter.tags(setup.t, a);
            }
        }
    }
}
