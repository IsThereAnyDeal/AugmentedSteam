import self_ from "./FChatDropdownOptions.svelte";
import Feature from "@Content/Modules/Context/Feature";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";

export default class FChatDropdownOptions extends Feature<CProfileHome> {

    override checkPrerequisites(): boolean {
        return this.context.user.isSignedIn;
    }

    override apply(): void {
        
        const anchor = document.querySelector<HTMLAnchorElement>("div.profile_header_actions > a[href*=OpenFriendChat]");
        if (!anchor) {
            return;
        }

        const m = anchor.href.match(/OpenFriendChat\(\s*'(\d+)'\s*,\s*(\d+)/);
        if (!m || !m[1] || !m[2]) {
            throw new Error("steamids not found from anchor href");
        }

        (new self_({
            target: anchor.parentElement!,
            anchor,
            props: {
                sendButton: anchor,
                steamid: m[1],
                accountid: Number(m[2]),
            }
        }));
    }
}
