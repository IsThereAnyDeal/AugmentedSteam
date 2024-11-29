import base64 = util.base64;
import type UserInterface from "@Core/User/UserInterface";
import {StoreBrowse, Wishlist} from "@Protobufs/Compiled/proto.bundle";
import {util} from "protobufjs";

function WishlistService(user: UserInterface): Wishlist {
    return new Wishlist(async (method, requestData, callback) => {
        const url = new URL(`https://api.steampowered.com/IWishlistService/${method.name}/v1`);
        url.searchParams.set("access_token", await user.getWebApiToken());
        url.searchParams.set("input_protobuf_encoded", base64.encode(requestData, 0 , requestData.length));
        url.searchParams.set("origin", "https://store.steampowered.com");

        const response = await fetch(url, {
            method: {
                "RemoveFromWishlist": "POST"
            }[method.name] ?? "GET"
        });
        const buffer = new Uint8Array(await response.arrayBuffer());

        callback(null, (Array.from(buffer) as unknown) as Uint8Array);
    });
}

function StoreBrowseService(user: UserInterface): StoreBrowse {
    return new StoreBrowse(async (method, requestData, callback) => {
        const url = new URL(`https://api.steampowered.com/IStoreBrowseService/${method.name}/v1`);
        url.searchParams.set("access_token", await user.getWebApiToken());
        url.searchParams.set("input_protobuf_encoded", base64.encode(requestData, 0 , requestData.length));
        url.searchParams.set("origin", "https://store.steampowered.com");

        const response = await fetch(url);
        const buffer = new Uint8Array(await response.arrayBuffer());

        callback(null, (Array.from(buffer) as unknown) as Uint8Array);
    });
}

export default {
    WishlistService,
    StoreBrowseService
};