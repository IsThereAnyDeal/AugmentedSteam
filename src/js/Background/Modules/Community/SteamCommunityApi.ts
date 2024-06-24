import { EAction } from "@Background/EAction";
import Api from "../Api";
import IndexedDB from "@Background/Db/IndexedDB";
import type {TFetchBadgeInfoResponse, TFetchReviewsResponse, TLogin, TReview} from "./_types";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import DOMPurify from "dompurify";
import Errors from "@Core/Errors/Errors";
import HTMLParser from "@Core/Html/HtmlParser";
import LocalStorage from "@Core/Storage/LocalStorage";
import TimeUtils from "@Core/Utils/TimeUtils";
import {Unrecognized} from "@Background/background";
import DomParserFactory from "@Background/Modules/Dom/DomParserFactory";

export default class SteamCommunityApi extends Api implements MessageHandlerInterface {

    constructor() {
        super("https://steamcommunity.com/")
    }

    private async fetchPage(url: URL) {
        const response = await fetch(url, {credentials: "include"});

        if (!response.ok) {
            throw new Errors.HTTPError(response.status, response.statusText);
        }

        if (new URL(response.url).pathname === "/login/home/") {
            throw new Errors.LoginError("community");
        }

        return await response.text();
    }

    private fetchBadgeInfo(steamid: string, appid: number): Promise<TFetchBadgeInfoResponse> {
        const url = this.getUrl(`/profiles/${steamid}/ajaxgetbadgeinfo/${appid}`);
        return this.fetchJson(url, {credentials: "include"});
    }

    /**
     * @return Promise<number>  result size in kB
     */
    private async fetchWorkshopFileSize(id: number): Promise<number> {
        const url = this.getUrl("/sharedfiles/filedetails/", {id});
        const html = await this.fetchText(url, {credentials: "include"});

        const parser = DomParserFactory.getParser();
        const size = await parser.parseWorkshopFileSize(html);

        if (size === -1) {
            throw new Error(`Couldn't find details block for item id "${id}"`);
        }

        if (size === -2) {
            throw new Error(`Invalid file size for item id "${id}"`);
        }

        return size;
    }

    private async getWorkshopFileSize(id: number, preventFetch: boolean): Promise<number|null> {
        let entry = await IndexedDB.get("workshopFileSizes", id)

        if (!entry || TimeUtils.isInPast(entry.expiry)) {
            if (preventFetch) {
                await IndexedDB.delete("workshopFileSizes", id);
                return null;
            } else {
                entry = {
                    size: await this.fetchWorkshopFileSize(id),
                    expiry: TimeUtils.now() + 5 * 86400
                };
                await IndexedDB.put("workshopFileSizes", entry, id);
            }
        }

        return entry.size;
    }

    private async fetchReviews(steamId: string, pages: number): Promise<TFetchReviewsResponse> {
        const parser = DomParserFactory.getParser();
        const reviews: TReview[] = [];
        let defaultOrder = 0;

        for (let p = 1; p <= pages; p++) {
            const url = this.getUrl(`${steamId}/recommended`, {p});
            const html = await this.fetchPage(url);

            const parsedReviews = await parser.parseReviews(html);
            for (let review of parsedReviews) {
                review.default = defaultOrder++;
                reviews.push(review);
            }
        }

        return reviews;
    }

    private async getReviews(steamId: string, pages: number): Promise<TFetchReviewsResponse> {
        let entry = await IndexedDB.get("reviews", steamId)

        if (!entry || TimeUtils.isInPast(entry.expiry)) {
            entry = {
                data: await this.fetchReviews(steamId, pages),
                expiry: TimeUtils.now() + 60*60
            };
            await IndexedDB.put("reviews", entry, steamId);
        }

        return entry.data;
    }

    /*
     * Invoked when the content script thinks the user is logged in
     * If we don't know the user's steamId, fetch their community profile
     */
    private async login(profilePath: string): Promise<TLogin> {

        if (!profilePath) {
            await this.logout();
            throw new Error("Login endpoint needs a valid profile path");
        }
        if (!profilePath.startsWith("/id/") && !profilePath.startsWith("/profiles/")) {
            await this.logout();
            throw new Error(`Could not interpret ${profilePath} as a valid profile path`);
        }

        const login = await LocalStorage.get("login");
        if (login?.profilePath === profilePath) {
            return login;
        }

        const url = this.getUrl(profilePath);
        const html = await this.fetchText(url);
        const profileData = HTMLParser.getObjectVariable("g_rgProfileData", html);
        const steamId = profileData?.steamid;

        if (!steamId) { // this should never happen
            throw new Error("Failed to retrieve steamID from profile");
        }

        await this.logout(true);

        const value = {steamId, profilePath};
        await LocalStorage.set("login", value);

        return value;
    }

    private async logout(force: boolean|undefined=undefined): Promise<void> {
        if (force === undefined) {
            force = (await LocalStorage.get("login") !== undefined)
        }
        if (force) {
            await Promise.all([
                LocalStorage.remove("login"),
                LocalStorage.remove("storeCountry"),
                LocalStorage.remove("currency")
            ]);
        }
    }

    // TODO This and (at least) the login calls don't seem appropriate in this class
    private async setStoreCountry(newCountry: string): Promise<void> {
        await LocalStorage.set("storeCountry", newCountry);
    }

    private async getStoreCountry(): Promise<string|null> {
        return (await LocalStorage.get("storeCountry")) ?? null;
    }

    handle(message: any): typeof Unrecognized|Promise<any> {

        switch(message.action) {

            case EAction.BadgeInfo:
                return this.fetchBadgeInfo(message.params.steamId, message.params.appid);

            case EAction.WorkshopFileSize:
                return this.getWorkshopFileSize(message.params.id, message.params.preventFetch);

            case EAction.Reviews:
                return this.getReviews(message.params.steamId, message.params.pages);

            case EAction.Login:
                return this.login(message.params.profilePath);

            case EAction.Logout:
                return this.logout(message.params.force ?? undefined);

            case EAction.StoreCountry_Set:
                return this.setStoreCountry(message.params.newCountry);

            case EAction.StoreCountry_Get:
                return this.getStoreCountry();
        }

        return Unrecognized;
    }
}
