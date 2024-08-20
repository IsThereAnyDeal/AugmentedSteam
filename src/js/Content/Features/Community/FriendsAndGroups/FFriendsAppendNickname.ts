import Feature from "@Content/Modules/Context/Feature";
import type CFriendsAndGroups from "@Content/Features/Community/FriendsAndGroups/CFriendsAndGroups";
import Settings from "@Options/Data/Settings";
import RequestData from "@Content/Modules/RequestData";
import User from "@Content/Modules/User";

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

        const nicknamedFriends = document.querySelectorAll(".player_nickname_hint");
        if (nicknamedFriends.length === 0) { return; }

        const steamidMap = new Map();
        for (const node of nicknamedFriends) {
            const steamid = node.closest<HTMLElement>("[data-steamid]")!.dataset.steamid;
            steamidMap.set(node, steamid);
        }

        const steamids = [...steamidMap.values()];
        const personaMap = new Map();
        const chunkSize = 99; // Max 100
        const token = await User.getWebApiToken();

        for (let i = 0; i < steamids.length; i += chunkSize) {
            const chunk = steamids.slice(i, i + chunkSize).join(",");

            const data = await RequestData.getJson<{
                players: {
                    steamid: string,
                    personaname: string,
                    lastlogoff?: number, // If friends
                }[]
            }>(`https://api.steampowered.com/ISteamUserOAuth/GetUserSummaries/v1/?steamids=${chunk}&access_token=${token}`, {credentials: "omit"})
                .catch(err => console.error(err));

            data?.players?.forEach(player => {
                personaMap.set(player.steamid, player.personaname);
            });
        }

        if (personaMap.size === 0) { return; }

        for (const [node, steamid] of steamidMap.entries()) {
            const persona = personaMap.get(steamid);
            const nickname = node.previousSibling!.textContent!.trim();

            node.previousSibling!.textContent = persona;
            node.after(...node.children); // Fix last online text styles
            node.textContent = ` (${nickname})`;
        }
    }
}
