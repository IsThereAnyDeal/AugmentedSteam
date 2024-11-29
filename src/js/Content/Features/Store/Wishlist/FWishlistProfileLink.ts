import type CWishlist from "@Content/Features/Store/Wishlist/CWishlist";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";

// TODO consider removing?
export default class FWishlistProfileLink extends Feature<CWishlist> {

    override apply(): void {
        const profileLink = new URL(window.location.pathname.replace("/wishlist", ""), "https://steamcommunity.com");
        
        let avatar = document.querySelector<HTMLElement>(".OVtmn7mzw0o-")
            ?? (document.querySelector("div + h2")?.previousElementSibling ?? null) as HTMLElement|null; // fallback

        if (!avatar) {
            throw new Error("Did not find avatar node");
        }

        HTML.wrap(
            `<a href="${profileLink}" target="_blank"></a>`,
            avatar, avatar
        );
    }
}
