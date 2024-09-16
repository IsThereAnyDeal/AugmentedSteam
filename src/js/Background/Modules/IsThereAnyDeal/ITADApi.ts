import Api from "../Api";
import Config from "config";
import IndexedDB from "@Background/Db/IndexedDB";
import type {
    TCollectionCopiesResponse,
    TCollectionCopy,
    TGetNotesApiResponse,
    TGetStoreListResponse,
    TInCollectionResponse,
    TInWaitlistResponse,
    TLastImportResponse,
    TNotesList,
    TPushNotesStatus,
    TShopInfo, TSyncEvent
} from "./_types";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import Authorization from "./Authorization";
import Settings, {SettingsStore} from "@Options/Data/Settings";
import AccessToken from "@Background/Modules/IsThereAnyDeal/AccessToken";
import {EAction} from "@Background/EAction";
import Errors from "@Core/Errors/Errors";
import LocalStorage from "@Core/Storage/LocalStorage";
import TimeUtils from "@Core/Utils/TimeUtils";
import {Unrecognized} from "@Background/background";
import {__userNote_syncErrorEmpty, __userNote_syncErrorLength, __userNote_syncErrorUnknown} from "@Strings/_strings";
import SyncedStorageAdapter from "@Content/Modules/UserNotes/Adapters/SyncedStorageAdapter";

const MaxNoteLength = 250;
const SyncEventsLimit = 40;
const StoreListTTL = 84600;
const PushGamesInterval = 5*60;
const PullWaitlistInterval = 15*60;
const PullCollectionInterval = 15*60;
const PullNotesInterval = 2*60;

const RequiredScopes = [
    "wait_read",
    "wait_write",
    "coll_read",
    "coll_write",
    "notes_read",
    "notes_write"
];

export default class ITADApi extends Api implements MessageHandlerInterface {

    constructor() {
        super(Config.ITADApiServerHost);
    }

    private async fetchStoreList(): Promise<TShopInfo[]> {
        const url = this.getUrl("service/shops/v1");
        const storeList = (await this.fetchJson(url));

        if (!Array.isArray(storeList)) {
            throw new Error("Can't read store list from response");
        }

        return storeList.map(store => {return {
            id: store.id,
            title: store.title
        }});
    }

    /**
     * @return Promise<Map<string,string>>    Map<steamId, itadId>
     */
    private async fetchSteamIds(gids: string[]): Promise<Map<string, string>> {
        const url = this.getUrl("lookup/shop/61/id/v1");
        let obj = await this.fetchJson<Record<string, string[]|null>>(url, {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify(gids)
        });

        let map: Map<string, string> = new Map();
        for (let [itad, steamIds] of Object.entries(obj)) {
            if (steamIds !== null) {
                for (let steamId of steamIds) {
                    map.set(steamId, itad);
                }
            }
        }
        return map;
    }

    private async fetchGameIds(steamIds: string[]): Promise<Map<string, string>> {
        const url = this.getUrl("lookup/id/shop/61/v1");
        let obj = await this.fetchJson<Record<string, string|null>>(url, {
            method: "POST",
            headers: {"content-type": "application/json"},
            body: JSON.stringify(steamIds)
        });

        let map = new Map();
        for (let [steam, itad] of Object.entries(obj)) {
            if (itad !== null) {
                map.set(steam, itad);
            }
        }
        return map;
    }

    private async fetchCollection(): Promise<Map<string, TCollectionCopy[]>|null> {
        const accessToken = await AccessToken.load();
        if (!accessToken) {
            return null;
        }

        const collectionResponse = await this.fetchJson<{id: string}[]>(
            this.getUrl("/collection/games/v1"), {
                headers: {"authorization": "Bearer " + accessToken}
            });

        if (collectionResponse.length === 0) {
            return null;
        }

        const collection = new Map<string, TCollectionCopy[]>();
        for (let game of collectionResponse) {
            collection.set(game.id, []);
        }

        const copiesResponse = await this.fetchJson<TCollectionCopiesResponse>(
            this.getUrl("/collection/copies/v1"), {
                headers: {"authorization": "Bearer " + accessToken}
            });

        for (let item of copiesResponse) {
            const gid = item.game.id;
            let copy: TCollectionCopy = {
                redeemed: item.redeemed
            };
            if (item.shop) {
                copy.shop = item.shop.name;
            }
            if (item.note) {
                copy.note = item.note;
            }
            if (item.tags.length > 0) {
                copy.tags = item.tags.map(tag => tag.tag);
            }

            collection.get(gid)?.push(copy);
        }

        const idMap = await this.fetchSteamIds([...collection.keys()])
        let result: Map<string, TCollectionCopy[]> = new Map<string, TCollectionCopy[]>();
        for (let [steamId, itadId] of idMap.entries()) {
            result.set(steamId, collection.get(itadId) ?? []);
        }
        return result;
    }

    private async fetchWaitlist() {
        const accessToken = await AccessToken.load();
        if (!accessToken) {
            return null;
        }

        const url = this.getUrl("/waitlist/games/v1")
        let waitlist = await this.fetchJson<{id: string}[]>(url, {
            headers: {"authorization": "Bearer " + accessToken}
        });
        if (waitlist.length === 0) {
            return null;
        }

        let gids = waitlist.map(entry => entry.id);
        return await this.fetchSteamIds(gids);
    }

    private async getStoreList(): Promise<TGetStoreListResponse> {
        if (await IndexedDB.isStoreExpired("storeList")) {
            let result = await this.fetchStoreList();
            await IndexedDB.replaceAll("storeList", result.map(store => [store.id, store]));
            await IndexedDB.setStoreExpiry("storeList", StoreListTTL);
            return result;
        } else {
            return await IndexedDB.db.getAll("storeList");
        }
    }

    private async isConnected(): Promise<boolean> {
        return (await AccessToken.load()) !== null;
    }

    private async disconnect(): Promise<void> {
        await AccessToken.clear();
        await LocalStorage.remove("lastItadImport");
        await LocalStorage.remove("syncEvents");
        return IndexedDB.clear("collection", "waitlist", "itadImport");
    }

    private async getLastImport(): Promise<TLastImportResponse> {
        return (await LocalStorage.get("lastItadImport")) ?? {from: null, to: null};
    }

    private async recordLastImport(): Promise<void> {
        let lastImport = await this.getLastImport();
        lastImport.from = TimeUtils.now();
        await LocalStorage.set("lastItadImport", lastImport);
    }

    private async getSyncEvents(): Promise<TSyncEvent[]> {
        return (await LocalStorage.get("syncEvents")) ?? [];
    }

    private async recordSyncEvent(section: string, type: "push"|"pull", count: number): Promise<void> {
        const events = await this.getSyncEvents();
        events.unshift({section, type, timestamp: TimeUtils.now(), count});
        await LocalStorage.set("syncEvents", events.slice(0, SyncEventsLimit));
    }

    private async removeFromWaitlist(appids: number[]) {
        const accessToken = await AccessToken.load();
        if (!accessToken) {
            throw new Error("Missing access token");
        }

        if (appids.length === 0) {
            throw new Error("Can't remove nothing from ITAD Waitlist!");
        }
        const steamIds = appids.map(appid => `app/${appid}`);

        let gids = await Promise.all(
            steamIds.map(id => IndexedDB.get("waitlist", id))
        );
        gids = gids.filter(value => value); // filter out undefined values

        if (gids.length > 0) {
            const url = this.getUrl("waitlist/games/v1");
            let response = await fetch(url, {
                method: "DELETE",
                headers: {"authorization": "Bearer " + accessToken},
                body: JSON.stringify(gids)
            });

            if (!response.ok) {
                throw new Errors.HTTPError(response.status, response.statusText);
            }

            return IndexedDB.delete("waitlist", ...steamIds)
        }
        // TODO error handling
    }

    private async addToWaitlist(appids: number[]) {
        const accessToken = await AccessToken.load();
        if (!accessToken) {
            throw new Error("Missing access token");
        }

        const steamIds = appids.map(appid => `app/${appid}`);
        const map = await this.fetchGameIds(steamIds);

        if (map.size !== 0) {
            let response = await fetch(new URL("waitlist/games/v1", Config.ITADApiServerHost), {
                method: "PUT",
                headers: {"authorization": "Bearer " + accessToken},
                body: JSON.stringify(Array.from(map.values()))
            });

            if (!response.ok) {
                throw new Errors.HTTPError(response.status, response.statusText);
            }

            return IndexedDB.putMany("waitlist", [...map]);
        }

        // TODO error handling
    }

    private async addToCollection(appids: number[], subids: number[]) {
        const accessToken = await AccessToken.load();
        if (!accessToken) {
            throw new Error("Missing access token");
        }

        const steamids = [
            ...appids.map(appid => `app/${appid}`),
            ...subids.map(subid => `sub/${subid}`),
        ];

        if (steamids.length === 0) {
            return;
        }

        const map = await this.fetchGameIds(steamids);

        if (map.size !== 0) {
            let response = await fetch(new URL("collection/games/v1", Config.ITADApiServerHost), {
                method: "PUT",
                headers: {"authorization": "Bearer " + accessToken},
                body: JSON.stringify(Array.from(map.values()))
            });

            if (response.ok) {
                return IndexedDB.putMany("collection", [...map.keys()].map(key => [key, []]))
            }
        }

        // TODO error handling
    }

    private async exportToItad(force: boolean): Promise<void> {
        await SettingsStore.load();

        if (!Settings.itad_sync_library && !Settings.itad_sync_wishlist) {
            return;
        }

        if (!force) {
            const lastImport = await this.getLastImport();

            if (lastImport.to && TimeUtils.isInFuture(lastImport.to + PushGamesInterval)) {
                return;
            }
        }

        if (Settings.itad_sync_library) {
            const tx = IndexedDB.db.transaction(["dynamicStore", "itadImport"]);
            const dynamicStore = tx.objectStore("dynamicStore");
            const itadImport = tx.objectStore("itadImport");

            const lastOwnedApps: Set<number> = new Set(await itadImport.get("lastOwnedApps") ?? []);
            const lastOwnedPackages: Set<number> = new Set(await itadImport.get("lastOwnedPackages") ?? []);

            const ownedApps: number[] = await dynamicStore.get("ownedApps") ?? [];
            const ownedPackages: number[] = await dynamicStore.get("ownedPackages") ?? [];
            await tx.done;

            const newOwnedApps: number[] = ownedApps.filter(id => force || !lastOwnedApps.has(id));
            const newOwnedPackages: number[] = ownedPackages.filter(id => force || !lastOwnedPackages.has(id));

            if (newOwnedApps.length > 0 || newOwnedPackages.length > 0) {
                await this.addToCollection(newOwnedApps, newOwnedPackages);
                await IndexedDB.putMany("itadImport", [
                    ["lastOwnedApps", ownedApps],
                    ["lastOwnedPackages", ownedPackages]
                ])
            }
            await this.recordSyncEvent("collection", "push", newOwnedApps.length + newOwnedPackages.length);
        }

        if (Settings.itad_sync_wishlist) {
            const tx = IndexedDB.db.transaction(["dynamicStore", "itadImport"]);
            const dynamicStore = tx.objectStore("dynamicStore");
            const itadImport = tx.objectStore("itadImport");

            const lastWishlisted: Set<number> = new Set(await itadImport.get("lastWishlisted") ?? []);
            const wishlisted: number[] = await dynamicStore.get("wishlisted") ?? [];
            await tx.done;

            const newWishlisted: number[] = wishlisted.filter(id => force || !lastWishlisted.has(id));

            if (newWishlisted.length > 0) {
                await this.addToWaitlist(newWishlisted);
                await IndexedDB.put("itadImport", wishlisted, "lastWishlisted");
            }
            await this.recordSyncEvent("waitlist", "push", newWishlisted.length);
        }

        let lastImport = await this.getLastImport();
        lastImport.to = TimeUtils.now();

        await LocalStorage.set("lastItadImport", lastImport);
    }

    private async importWaitlist(force: boolean): Promise<void> {
        await SettingsStore.load();

        if (!Settings.itad_sync_wishlist) {
            return;
        }
        if (force || await IndexedDB.isStoreExpired("waitlist")) {
            const data = await this.fetchWaitlist();
            await IndexedDB.replaceAll("waitlist", data ? [...data.entries()] : []);
            await IndexedDB.setStoreExpiry("waitlist", PullWaitlistInterval);
            await this.recordLastImport();
            await this.recordSyncEvent("waitlist", "pull", data?.size ?? 0);
        }
    }

    private async importCollection(force: boolean): Promise<void> {
        await SettingsStore.load();

        if (!Settings.itad_sync_library) {
            return;
        }
        if (force || await IndexedDB.isStoreExpired("collection")) {
            const data = await this.fetchCollection();
            await IndexedDB.replaceAll("collection", data ? [...data.entries()] : []);
            await IndexedDB.setStoreExpiry("collection", PullCollectionInterval);
            await this.recordLastImport();
            await this.recordSyncEvent("collection", "pull", data?.size ?? 0);
        }
    }

    private async sync(force: boolean): Promise<void> {
        await SettingsStore.load();

        await this.exportToItad(force);
        await this.importWaitlist(force);
        await this.importCollection(force);

        if (Settings.itad_sync_notes) {
            await this.pullNotes(force);
        }
    }

    private async inWaitlist(storeIds: string[]): Promise<TInWaitlistResponse> {
        await this.importWaitlist(false);
        return IndexedDB.contains("waitlist", storeIds);
    }

    private async inCollection(storeIds: string[]): Promise<TInCollectionResponse> {
        await this.importCollection(false);
        return IndexedDB.contains("collection", storeIds);
    }

    private async getFromCollection(storeId: string): Promise<TCollectionCopy[]|null> {
        await this.importCollection(false);
        return (await IndexedDB.get("collection", storeId)) ?? null;
    }

    private async pullNotes(force: boolean): Promise<number> {
        await SettingsStore.load();

        if (!force && !(await IndexedDB.isStoreExpired("notes"))) {
            return 0;
        }

        const accessToken = await AccessToken.load();
        if (!accessToken) {
            throw new Errors.OAuthUnauthorized();
        }

        const response = await this.fetchJson<TGetNotesApiResponse>(
            this.getUrl("/user/notes/v1"), {
                method: "GET",
                headers: {
                    "authorization": "Bearer " + accessToken,
                    "accept": "application/json"
                }
            });

        const result: Map<number, string> = new Map();

        if (response.length !== 0) {
            const notes: Map<string, string> = new Map<string, string>(
                response.map(o => [o.gid, o.note])
            );

            const steamIds = await this.fetchSteamIds([...notes.keys()]);

            for (let [steamId, gid] of steamIds) {
                if (!steamId.startsWith("app/")) {
                    continue;
                }

                const appid = Number(steamId.substring(4));
                const note = notes.get(gid)!;

                result.set(appid, note);
            }

            switch(Settings.user_notes_adapter) {
                case "synced_storage":
                    /**
                     * A little bit of hack, but SyncedStorageAdapter may be used in Background,
                     * and it does better handling that I would want to do here.
                     * Synced Storage should be removed in future versions.
                     */
                    const adapter = new SyncedStorageAdapter();
                    for (const [appid, note] of result) {
                        await adapter.set(appid, note);
                    }
                    break;

                case "idb":
                    await IndexedDB.putMany("notes",
                        [...result.entries()].map(([appid, note]) => [Number(appid), note])
                    );
                    break;
            }
        }

        await IndexedDB.setStoreExpiry("notes", PullNotesInterval);
        await this.recordLastImport();
        await this.recordSyncEvent("notes", "pull", result.size);
        return result.size;
    }

    private async pushNotes(notes: TNotesList): Promise<TPushNotesStatus> {
        const accessToken = await AccessToken.load();
        if (!accessToken) {
            throw new Errors.OAuthUnauthorized();
        }

        const status: TPushNotesStatus = {
            pushed: 0,
            errors: []
        }

        if (notes.length === 0) {
            return status;
        }

        const map: Map<number, string> = new Map<number, string>(notes);
        const appids = [...map.keys()].map(appid => `app/${appid}`);

        const gids = await this.fetchGameIds(appids);

        let toPush: Array<{
            gid: string,
            note: string
        }> = [];

        for (let [appid, note] of map.entries()) {
            note = note.trim();
            if (note === "") {
                status.errors.push([appid, __userNote_syncErrorEmpty, null]);
                continue;
            }

            if (note.length > MaxNoteLength) {
                status.errors.push([appid, __userNote_syncErrorLength, {
                    length: note.length,
                    max: MaxNoteLength
                }]);
                continue;
            }

            const gid: string|null = gids.get(`app/${appid}`) ?? null;
            if (gid === null) {
                status.errors.push([appid, __userNote_syncErrorUnknown, null]);
                continue;
            }

            toPush.push({gid, note});
        }

        if (toPush.length !== 0) {
            const response = await fetch(
                this.getUrl("/user/notes/v1"), {
                    method: "PUT",
                    headers: {
                        "authorization": "Bearer " + accessToken,
                        "content-type": "application/json",
                        "accept": "application/json",
                    },
                    body: JSON.stringify(toPush)
                });

            if (!response.ok) {
                throw new Errors.HTTPError(response.status, response.statusText);
            }
        }

        status.pushed = toPush.length;
        await this.recordSyncEvent("notes", "push", status.pushed);
        return status;
    }

    private async deleteNotes(appids: number[]): Promise<void> {
        const accessToken = await AccessToken.load();
        if (!accessToken) {
            throw new Errors.OAuthUnauthorized();
        }

        const gids = await this.fetchGameIds(
            appids.map(appid => `app/${appid}`)
        );

        const response = await fetch(
            this.getUrl("/user/notes/v1"), {
                method: "DELETE",
                headers: {
                    "authorization": "Bearer " + accessToken,
                    "content-type": "application/json"
                },
                body: JSON.stringify([...gids.values()])
            });

        if (!response.ok) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }
    }


    handle(message: any): typeof Unrecognized|Promise<any> {

        switch(message.action) {
            case EAction.StoreList:
                return this.getStoreList();

            case EAction.Authorize:
                return ((new Authorization()).authorize(RequiredScopes));

            case EAction.Disconnect:
                return this.disconnect();

            case EAction.IsConnected:
                return this.isConnected();

            case EAction.Export:
                return this.exportToItad(message.params.force);

            case EAction.Sync:
                return this.sync(message.params.force);

            case EAction.LastImport:
                return this.getLastImport();

            case EAction.SyncEvents:
                return this.getSyncEvents();

            case EAction.InWaitlist:
                return this.inWaitlist(message.params.storeIds);

            case EAction.AddToWaitlist:
                return this.addToWaitlist(message.params.appids);

            case EAction.RemoveFromWaitlist:
                return this.removeFromWaitlist(message.params.appids);

            case EAction.InCollection:
                return this.inCollection(message.params.storeIds);

            case EAction.GetFromCollection:
                return this.getFromCollection(message.params.storeId);

            case EAction.ITAD_Notes_Pull:
                return this.pullNotes(true);

            case EAction.ITAD_Notes_Push:
                return this.pushNotes(message.params.notes);

            case EAction.ITAD_Notes_Delete:
                return this.deleteNotes(message.params.appids);
        }

        return Unrecognized;
    }
}
