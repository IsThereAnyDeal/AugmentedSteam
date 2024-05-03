import { EAction } from "@Background/EAction";
import {LocalStorage, TimeUtils} from "../../../modulesCore";
import Api from "../Api";
import IndexedDB from "@Background/Db/IndexedDB";
import type {TFetchBadgeInfoResponse, TFetchReviewsResponse, TReview} from "./_types";
import type MessageHandlerInterface from "@Background/MessageHandlerInterface";
import DOMPurify from "dompurify";
import Errors from "@Core/Errors/Errors";
import HTMLParser from "@Core/Html/HtmlParser";

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

    private async fetchWorkshopFileSize(id: string): Promise<number> {
        const parser = new DOMParser();

        const url = this.getUrl("/sharedfiles/filedetails/", {id});
        const html = await this.fetchText(url, {credentials: "include"});
        const doc = parser.parseFromString(html, "text/html");

        const details = doc.querySelector(".detailsStatRight")?.textContent;
        if (!details || !details.includes("MB")) {
            throw new Error(`Couldn't find details block for item id "${id}"`);
        }

        const size = parseFloat(details.replace(/,/g, ""));
        if (Number.isNaN(size)) {
            throw new Error(`Invalid file size for item id "${id}"`);
        }

        return size*1000;
    }

    private async getWorkshopFileSize(id: string, preventFetch: boolean) {
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
        const parser = new DOMParser();
        const reviews: TReview[] = [];
        let defaultOrder = 0;

        for (let p = 1; p <= pages; p++) {
            const url = this.getUrl(`${steamId}/recommended`, {p});
            const html = await this.fetchPage(url);
            const doc = parser.parseFromString(html, "text/html");

            for (const node of doc.querySelectorAll(".review_box")) {
                defaultOrder++;

                const rating = node.querySelector("[src*=thumbsUp]") ? 1 : 0;

                const [helpful = 0, funny = 0] = Array.from(node.querySelector(".header")?.childNodes ?? [])
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => {
                        const text = node.textContent?.match(/(?:\d+,)?\d+/);
                        return text ? Number(text[0].replace(/,/g, "")) : 0;
                    });

                const length = node.querySelector(".content")!.textContent!.trim().length;

                // There are only two kinds of visibility, Public: 0; Friends-only: 1
                const visibilityNode = node.querySelector<HTMLInputElement>("input[id^=ReviewVisibility]");
                const visibility = visibilityNode ? Number(visibilityNode.value) : 0;

                const reviewId = visibilityNode
                    // Only exists when the requested profile is yours
                    ? visibilityNode.id.replace("ReviewVisibility", "")
                    // Otherwise you have buttons to vote for and award the review
                    : node.querySelector(".control_block > a")!.id.replace("RecommendationVoteUpBtn", "");

                // Total playtime comes first
                const playtimeText = node.querySelector(".hours")!.textContent!.match(/(?:\d+,)?\d+\.\d+/);
                const playtime = playtimeText ? parseFloat(playtimeText[0].replace(/,/g, "")) : 0.0;

                // Count total awards received
                const awards = Array.from(node.querySelectorAll(".review_award"))
                    .reduce((acc, node) => {
                        const count = node.classList.contains("more_btn")
                            ? 0
                            : Number(node.querySelector(".review_award_count")!.textContent!.trim());
                        return acc + count;
                    }, 0);

                const devResponseNode = node.nextElementSibling?.classList.contains("review_developer_response_container")
                    ? DOMPurify.sanitize(node.nextElementSibling.outerHTML)
                    : "";

                reviews.push({
                    "default": defaultOrder,
                    rating,
                    helpful,
                    funny,
                    length,
                    visibility,
                    playtime,
                    awards,
                    "node": DOMPurify.sanitize(node.outerHTML) + devResponseNode,
                    "id": reviewId
                });
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
    private async login(profilePath: string) {

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
        const steamId = profileData.steamid;

        if (!steamId) { // this should never happen
            throw new Error("Failed to retrieve steamID from profile");
        }

        await this.logout(true);

        const value = {steamId, profilePath};
        await LocalStorage.set("login", value);

        return value;
    }

    private async logout(force: boolean|undefined=undefined) {
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
    private async storeCountry(newCountry: string|undefined=undefined): Promise<string|null> {
        if (newCountry) {
            await LocalStorage.set("storeCountry", newCountry);
            return null;
        } else {
            return (await LocalStorage.get("storeCountry")) ?? null;
        }
    }

    async handle(message: any): Promise<any> {

        switch(message.action) {

            case EAction.BadgeInfo:
                return await this.fetchBadgeInfo(message.params.steamId, message.params.appid);

            case EAction.WorkshopFileSize:
                return await this.getWorkshopFileSize(message.params.id, message.params.preventFetch);

            case EAction.Reviews:
                return await this.getReviews(message.params.steamId, message.params.pages);

            case EAction.Login:
                return await this.login(message.params.profilePath);

            case EAction.Logout:
                return await this.login(message.params.force ?? undefined);

            case EAction.StoreCountry:
                return await this.storeCountry(message.params.country ?? undefined);
        }

        return undefined;
    }
}
