import Feature from "@Content/Modules/Context/Feature";
import type CFriendsAndGroups from "@Content/Features/Community/FriendsAndGroups/CFriendsAndGroups";
import Settings from "@Options/Data/Settings";
import RequestData from "@Content/Modules/RequestData";
import User from "@Content/Modules/User";
import "./FFriendsAppendNickname.css";

export default class FFriendsAppendNickname extends Feature<CFriendsAndGroups> {

    // Apply this feature on all profiles to support common friends
    override checkPrerequisites(): boolean {
        return User.isSignedIn && Settings.friends_append_nickname;
    }

    apply(): void | Promise<void> {
        document.addEventListener("as_subpageNav", () => this.callback());
        this.callback();
    }

    private async callback(): Promise<void> {
        if (!document.getElementById("friends_list")) {
            return;
        }

        const nicknamedFriends: NodeListOf<HTMLElement> = document.querySelectorAll(".player_nickname_hint");
        if (nicknamedFriends.length === 0) { return; }

        const steamidMap: Map<string, HTMLElement> = new Map();
        for (const node of nicknamedFriends) {
            const steamid = node.closest<HTMLElement>("[data-steamid]")!.dataset.steamid!;
            steamidMap.set(steamid, node);
        }

        const chunkSize = 99; // Max 100
        const token = await User.getWebApiToken();

        const steamids: string[] = [...steamidMap.keys()];
        while (steamids.length > 0) {
            const chunk = steamids.splice(0, chunkSize).join(",");

            try {
                const data = await RequestData.getJson<{
                    players: {
                        steamid: string,
                        personaname: string,
                        lastlogoff?: number, // If friends
                    }[]
                }>(`https://api.steampowered.com/ISteamUserOAuth/GetUserSummaries/v1/?steamids=${chunk}&access_token=${token}`, {credentials: "omit"});

                for (let player of data.players ?? []) {
                    const node = steamidMap.get(player.steamid)!;

                    const persona = player.personaname;
                    const nickname = node.previousSibling!.textContent!.trim();

                    node.after(...node.children); // Fix last online text styles
                    node.previousSibling!.textContent = persona;
                    node.textContent = nickname;
                    node.closest(".friend_block_content")!.classList.add("has-note");
                }
            } catch(e) {
                console.error(e);
            }
        }
    }
}
