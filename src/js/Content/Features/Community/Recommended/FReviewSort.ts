import TimeUtils from "@Core/Utils/TimeUtils";
import {
    __awards,
    __date,
    __funny,
    __helpful,
    __length,
    __playtime,
    __processing,
    __rating,
    __visibility,
    __wait,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CRecommended from "@Content/Features/Community/Recommended/CRecommended";
import SortBox from "@Content/Modules/Widgets/SortBox.svelte";
import SyncedStorage from "@Core/Storage/SyncedStorage";
import SteamCommunityApiFacade from "@Content/Modules/Facades/SteamCommunityApiFacade";
import type {TReview} from "@Background/Modules/Community/_types";
import HTML from "@Core/Html/Html";
import BlockingWaitDialog from "@Core/Modals/BlockingWaitDialog";

export default class FReviewSort extends Feature<CRecommended> {

    private _reviewCount: number = 0;
    private _path: string = "";
    private _curPage: number = 0;
    private _pageCount: number = 10;
    private _pages: number = 0;
    private _reviews: TReview[]|undefined = undefined;

    override checkPrerequisites(): boolean {
        // Total number of reviews. Passed to background script for fetching reviews.
        this._reviewCount = Number(document.querySelector<HTMLElement>("#rightContents .review_stat .giantNumber")?.textContent?.trim());

        return this._reviewCount > 1;
    }

    override async apply(): Promise<void> {

        // Current profile path. Passed to background script for fetching reviews.
        this._path = window.location.pathname.match(/\/((?:id|profiles)\/.+?)\//)![1]!;

        // Current page. Used to calculate the portion of reviews to show after sorting.
        this._curPage = Number(new URLSearchParams(window.location.search).get("p") ?? 1);

        // Max reviews displayed per page.
        this._pageCount = 10;

        // Number of pages. Passed to background script for fetching reviews.
        this._pages = Math.ceil(this._reviewCount / this._pageCount);

        const anchor = document.querySelector<HTMLElement>("#leftContents > h1");
        if (!anchor) {
            return;
        }

        (new SortBox({
            target: anchor.parentElement!,
            anchor,
            props: {
                name: "reviews",
                options: [
                    ["default", L(__date)],
                    ["rating", L(__rating)],
                    ["helpful", L(__helpful)],
                    ["funny", L(__funny)],
                    ["length", L(__length)],
                    ["visibility", L(__visibility)],
                    ["playtime", L(__playtime)],
                    ["awards", L(__awards)],
                ],
                value: (await SyncedStorage.get("sortreviewsby")) ?? "default_ASC"
            }
        })).$on("change", e => {
            const {value, key, direction} = e.detail;
            SyncedStorage.set("sortreviewsby", value);
            this._sortReviews(key, direction < 0);
        });
    }

    async _sortReviews(sortBy: string, reversed: boolean): Promise<void> {

        if (this._reviews === undefined) {
            await this._getReviews();
        }

        for (const node of document.querySelectorAll(".review_box, .review_developer_response_container")) {
            node.remove();
        }

        let displayedReviews = this._reviews!.slice().sort((a, b) => {
            switch (sortBy) {
                case "rating":
                case "helpful":
                case "funny":
                case "length":
                case "visibility":
                case "playtime":
                case "awards":
                    return b[sortBy] - a[sortBy];
                case "default":
                    return a[sortBy] - b[sortBy];
                default:
                    this.logError(
                        new Error("Invalid sorting criteria"),
                        "Can't sort reviews by criteria '%s'",
                        sortBy,
                    );
                    return 0;
            }
        });

        if (reversed) {
            displayedReviews.reverse();
        }

        displayedReviews = displayedReviews.slice(this._pageCount * (this._curPage - 1), this._pageCount * this._curPage);

        const footer = document.querySelector("#leftContents > .workshopBrowsePaging:last-child");
        for (const {node} of displayedReviews) {
            HTML.beforeBegin(footer, node);
        }

        // Add back sanitized event handlers
        const loggedIn = this.context.user.isSignedIn ? 1 : 0;
        const loginURL = encodeURIComponent(`https://steamcommunity.com/login/home/?goto=${this._path}/recommended/?insideModal=0`);
        const ids = displayedReviews.map(review => review.id);
        document.querySelectorAll(".review_box").forEach((node, i) => {
            const id = ids[i];

            for (const award of node.querySelectorAll<HTMLElement>(".review_award")) {
                // More button shows up after 3 awards
                if (award.classList.contains("more_btn")) {
                    award.setAttribute("onclick", "UserReview_ShowMoreAwards(this);");
                } else {
                    const selected = award.dataset.tooltipHtml!.match(/animated\/(\d+)\.png/)![1];
                    award.setAttribute("onclick", `UserReview_Award(${loggedIn}, "${loginURL}", "${id}", OnUserReviewAward, ${selected});`);
                }
            }

            // Only exists when the requested profile is yours
            const containers = node.querySelectorAll(".dselect_container");

            if (containers.length > 0) {
                for (const container of containers) {
                    const type = container.id.startsWith("ReviewVisibility") ? "Visibility" : "Language";
                    const arg = `Review${type}${id}`;
                    const input = container.querySelector<HTMLInputElement>("input")!;
                    const trigger = container.querySelector<HTMLElement>(".trigger")!;
                    const selections = container.querySelectorAll(".dropcontainer a");

                    input.setAttribute("onchange", `OnReview${type}Change("${id}", "${arg}");`);

                    trigger.setAttribute("href", "javascript:DSelectNoop();");
                    trigger.setAttribute("onfocus", `DSelectOnFocus("${arg}");`);
                    trigger.setAttribute("onblur", `DSelectOnBlur("${arg}");`);
                    trigger.setAttribute("onclick", `DSelectOnTriggerClick("${arg}");`);

                    selections.forEach((selection, selIndex) => {
                        selection.setAttribute("href", "javascript:DSelectNoop();");
                        selection.setAttribute("onmouseover", `DHighlightItem("${arg}", ${selIndex}, false);`);
                        selection.setAttribute("onclick", `DHighlightItem("${arg}", ${selIndex}, true);`);
                    });
                }

            // Otherwise you have buttons to vote for and award the review
            } else {
                const [upvote, downvote, funny, award] = node.querySelectorAll<HTMLElement>(".control_block > .btn_small_thin");

                for (const btn of [upvote, downvote, funny]) {
                    btn!.setAttribute("href", "javascript:void(0)");
                }

                upvote!.setAttribute("onclick", `UserReviewVoteUp(${loggedIn}, "${loginURL}", "${id}");`);
                downvote!.setAttribute("onclick", `UserReviewVoteDown(${loggedIn}, "${loginURL}", "${id}");`);
                funny!.setAttribute("onclick", `UserReviewVoteTag(${loggedIn}, "${loginURL}", "${id}");`);
                award!.setAttribute("onclick", `UserReview_Award(${loggedIn}, "${loginURL}", "${id}", OnUserReviewAward);`);
            }
        });
    }

    async _getReviews(): Promise<void> {
        const waitDialog = new BlockingWaitDialog(L(__processing), () => L(__wait));
        await waitDialog.update();

        try {
            this._reviews = await SteamCommunityApiFacade.getReviews(this._path, this._pages);
        } finally {

            // Delay half a second to avoid dialog flicker when grabbing cache
            await TimeUtils.timer(500);
            waitDialog.dismiss();
        }
    }
}
