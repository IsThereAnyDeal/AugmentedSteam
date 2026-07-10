import Api from "../Api";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import IndexedDB from "@Background/Db/IndexedDB";
import {EAction} from "@Background/EAction";
import {Unrecognized} from "@Background/background";

export default class SteamWebApi extends Api implements MessageHandlerInterface {

    constructor() {
        super("https://api.steampowered.com/");
    }

    private async getFamilyLibrary(accessToken: string, steamId: string): Promise<{shareable: number[], owned: number[]}> {
        /*
         * This is a best-effort helper for an optional filter: it must degrade quietly.
         * It never throws, so a private member profile or a transient Steam API hiccup
         * doesn't surface as a failed request in the Augmented Steam status bar.
         */
        try {
            if (!await IndexedDB.isStoreExpired("familyLibrary")) {
                const shareable = await IndexedDB.get("familyLibrary", "shareable");
                const owned = await IndexedDB.get("familyLibrary", "owned");
                if (shareable !== undefined && owned !== undefined) {
                    return {shareable, owned};
                }
            }

            const groupUrl = this.getUrl("IFamilyGroupsService/GetFamilyGroupForUser/v1/", {
                access_token: accessToken,
                include_family_group_response: "true",
                format: "json"
            });

            const groupData = await this.fetchJson<{
                response: {
                    family_groupid?: string,
                    family_group?: {
                        members?: Array<{steamid: string}>
                    }
                }
            }>(groupUrl);

            const gid = groupData.response.family_groupid;
            if (!gid) {
                return this.storeFamilyLibrary([], []);
            }

            const appsUrl = this.getUrl("IFamilyGroupsService/GetSharedLibraryApps/v1/", {
                access_token: accessToken,
                family_groupid: gid,
                include_own: "false",
                include_excluded: "false",
                max_apps: 5000,
                format: "json"
            });

            const members = groupData.response.family_group?.members ?? [];
            const otherMembers = members.filter(m => m.steamid !== steamId);

            // Fetch the shareable library and every member's owned games concurrently.
            // allSettled: one member's private profile or a transient error must not
            // discard the whole result.
            const [appsResult, ...ownedResults] = await Promise.allSettled([
                this.fetchJson<{
                    response: {
                        apps?: Array<{appid: number}>
                    }
                }>(appsUrl),
                ...otherMembers.map(member => this.fetchJson<{
                    response: {
                        games?: Array<{appid: number}>
                    }
                }>(this.getUrl("IPlayerService/GetOwnedGames/v1/", {
                    access_token: accessToken,
                    steamid: member.steamid,
                    include_appinfo: "false",
                    include_played_free_games: "true",
                    format: "json"
                })))
            ]);

            // Optional chaining throughout: a member that returns an error envelope
            // (e.g. a private profile answering with EResultAccessDenied and no
            // `response` object) must contribute nothing without discarding the
            // apps or the other members' games.
            const shareable = appsResult!.status === "fulfilled"
                ? (appsResult!.value?.response?.apps ?? []).map(a => a.appid)
                : [];

            const ownedSet = new Set<number>();
            for (const result of ownedResults) {
                if (result.status === "fulfilled") {
                    for (const game of result.value?.response?.games ?? []) {
                        ownedSet.add(game.appid);
                    }
                }
            }

            return this.storeFamilyLibrary(shareable, Array.from(ownedSet));
        } catch (err) {
            console.warn("[Augmented Steam] Failed to fetch Steam Family library", err);
            return {shareable: [], owned: []};
        }
    }

    private async storeFamilyLibrary(shareable: number[], owned: number[]): Promise<{shareable: number[], owned: number[]}> {
        await IndexedDB.put("familyLibrary", shareable, "shareable");
        await IndexedDB.put("familyLibrary", owned, "owned");
        await IndexedDB.setStoreExpiry("familyLibrary", 15*60);
        return {shareable, owned};
    }

    handle(message: any): typeof Unrecognized|Promise<any> {
        switch (message.action) {
            case EAction.FamilyLibrary_Apps:
                return this.getFamilyLibrary(message.params.accessToken, message.params.steamId);
        }

        return Unrecognized;
    }
}
