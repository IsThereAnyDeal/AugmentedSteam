import base64 = util.base64;
import type UserInterface from "@Core/User/UserInterface";
import {Player, Quest, StoreBrowse, Wishlist} from "@Protobufs/Compiled/proto.bundle";
import {util} from "protobufjs";

export const enum EOrigin {
    Store = "https://store.steampowered.com",
    Community = "https://store.steampowered.com"
}

function WishlistService(user: UserInterface, origin: EOrigin = EOrigin.Store): Wishlist {
    return new Wishlist(async (method, requestData, callback) => {
        const url = new URL(`https://api.steampowered.com/IWishlistService/${method.name}/v1`);
        url.searchParams.set("access_token", await user.getWebApiToken());
        url.searchParams.set("input_protobuf_encoded", base64.encode(requestData, 0 , requestData.length));
        url.searchParams.set("origin", origin);

        const response = await fetch(url, {
            method: {
                "RemoveFromWishlist": "POST"
            }[method.name] ?? "GET"
        });
        const buffer = new Uint8Array(await response.arrayBuffer());

        callback(null, (Array.from(buffer) as unknown) as Uint8Array);
    });
}

function StoreBrowseService(user: UserInterface, origin: EOrigin = EOrigin.Store): StoreBrowse {
    return new StoreBrowse(async (method, requestData, callback) => {
        const url = new URL(`https://api.steampowered.com/IStoreBrowseService/${method.name}/v1`);
        url.searchParams.set("access_token", await user.getWebApiToken());
        url.searchParams.set("input_protobuf_encoded", base64.encode(requestData, 0 , requestData.length));
        url.searchParams.set("origin", origin);

        const response = await fetch(url);
        const buffer = new Uint8Array(await response.arrayBuffer());

        callback(null, (Array.from(buffer) as unknown) as Uint8Array);
    });
}

function PlayerService(user: UserInterface, origin: EOrigin = EOrigin.Store): Player {
    return new Player(async (method, requestData, callback) => {
        const url = new URL(`https://api.steampowered.com/IPlayerService/${method.name}/v1`);
        url.searchParams.set("access_token", await user.getWebApiToken());
        url.searchParams.set("input_protobuf_encoded", base64.encode(requestData, 0 , requestData.length));
        url.searchParams.set("origin", origin);

        const response = await fetch(url, {
            method: /^set|^GetAchievementsProgress/i.test(method.name) ? "POST" : "GET"
        });
        const buffer = new Uint8Array(await response.arrayBuffer());

        callback(null, (Array.from(buffer) as unknown) as Uint8Array);
    });
}

function QuestService(user: UserInterface, origin: EOrigin = EOrigin.Store): Quest {
    return new Quest(async (method, requestData, callback) => {
        const url = new URL(`https://api.steampowered.com/IQuestService/${method.name}/v1`);
        url.searchParams.set("access_token", await user.getWebApiToken());
        url.searchParams.set("input_protobuf_encoded", base64.encode(requestData, 0 , requestData.length));
        url.searchParams.set("origin", origin);

        const response = await fetch(url, {
            method: /^set/i.test(method.name) ? "POST" : "GET"
        });
        const buffer = new Uint8Array(await response.arrayBuffer());

        callback(null, (Array.from(buffer) as unknown) as Uint8Array);
    });
}

export default {
    WishlistService,
    StoreBrowseService,
    PlayerService,
    QuestService
};