import {HTML, Localization, SyncedStorage, TimeUtils} from "../../../../modulesCore";
import {Background, Feature, Messenger, Sortbox, User} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FReviewSort extends Feature {

    checkPrerequisites() {
        // Total number of reviews
        this._reviewCount = Number(document.querySelector("#rightContents .review_stat .giantNumber").textContent.trim());

        return this._reviewCount > 1;
    }

    apply() {

        // Patch award nodes and callback according to store pages/discussions
        this._patchReviewAwards();

        // Max reviews displayed per page
        this._pageCount = 10;

        // Current profile path. Passed to background script for fetching reviews.
        this._path = window.location.pathname.match(/\/((?:id|profiles)\/.+?)\//)[1];

        // Number of pages. Passed to background script for fetching reviews.
        this._pages = Math.ceil(this._reviewCount / this._pageCount);

        // Current page. Used to calculate the range of reviews to show after sorting.
        this._curPage = new URLSearchParams(window.location.search).get("p") || 1;

        // Whether the user has performed an action that may update review stats
        this._reviewUpdated = false;

        Messenger.addMessageListener("updateReview", () => { this._reviewUpdated = true; });

        Page.runInPageContext(() => {
            window.SteamFacade.jq(document).ajaxSuccess((event, xhr, {url}) => {
                const pathname = new URL(url).pathname;
                if (pathname.startsWith("/userreviews/rate/")
                    || pathname.startsWith("/userreviews/votetag/")
                    || pathname.startsWith("/userreviews/update/")) {

                    window.Messenger.postMessage("updateReview");
                }
            });
        });

        document.querySelector("#leftContents > h1").before(Sortbox.get(
            "reviews",
            [
                ["default", Localization.str.date],
                ["rating", Localization.str.rating],
                ["helpful", Localization.str.helpful],
                ["funny", Localization.str.funny],
                ["length", Localization.str.length],
                ["visibility", Localization.str.visibility],
                ["playtime", Localization.str.playtime],
                ["awards", Localization.str.awards],
            ],
            SyncedStorage.get("sortreviewsby"),
            (sortBy, reversed) => { this._sortReviews(sortBy, reversed); },
            "sortreviewsby"
        ));
    }

    async _sortReviews(sortBy, reversed) {

        if (this._reviewUpdated || typeof this._reviews === "undefined") {
            await this._getReviews();
        }

        for (const node of document.querySelectorAll(".review_box, .review_developer_response_container")) {
            node.remove();
        }

        let displayedReviews = this._reviews.slice().sort((a, b) => {
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
        const loggedIn = User.isSignedIn ? 1 : 0;
        const loginURL = encodeURIComponent(`https://steamcommunity.com/login/home/?goto=${this._path}/recommended/?insideModal=0`);
        const ids = displayedReviews.map(review => review.id);
        document.querySelectorAll(".review_box").forEach((node, i) => {
            const id = ids[i];

            for (const award of node.querySelectorAll(".review_award")) {
                // More button shows up after 3 awards
                if (award.classList.contains("more_btn")) {
                    award.setAttribute("onclick", "UserReview_ShowMoreAwards(this);");
                } else {
                    const selected = this._getSetAwardType(award);
                    award.setAttribute("onclick", `UserReview_Award(${loggedIn}, "${loginURL}", "${id}", OnUserReviewAward, ${selected});`);
                }
            }

            // Only exists when the requested profile is yours
            const containers = node.querySelectorAll(".dselect_container");

            if (containers.length > 0) {
                for (const container of containers) {
                    const type = container.id.startsWith("ReviewVisibility") ? "Visibility" : "Language";
                    const arg = `Review${type}${id}`;
                    const input = container.querySelector("input");
                    const trigger = container.querySelector(".trigger");
                    const selections = container.querySelectorAll(".dropcontainer a");

                    input.setAttribute("onchange", `OnReview${type}Change("${id}", "${arg}");`);

                    trigger.setAttribute("href", "javascript:DSelectNoop();"); // eslint-disable-line no-script-url
                    trigger.setAttribute("onfocus", `DSelectOnFocus("${arg}");`);
                    trigger.setAttribute("onblur", `DSelectOnBlur("${arg}");`);
                    trigger.setAttribute("onclick", `DSelectOnTriggerClick("${arg}");`);

                    selections.forEach((selection, selIndex) => {
                        selection.setAttribute("href", "javascript:DSelectNoop();"); // eslint-disable-line no-script-url
                        selection.setAttribute("onmouseover", `DHighlightItem("${arg}", ${selIndex}, false);`);
                        selection.setAttribute("onclick", `DHighlightItem("${arg}", ${selIndex}, true);`);
                    });
                }

            // Otherwise you have buttons to vote for and award the review
            } else {
                const [upvote, downvote, funny, award] = node.querySelectorAll(".control_block > .btn_small_thin");

                for (const btn of [upvote, downvote, funny]) {
                    btn.setAttribute("href", "javascript:void(0)"); // eslint-disable-line no-script-url
                }

                upvote.setAttribute("onclick", `UserReviewVoteUp(${loggedIn}, "${loginURL}", "${id}");`);
                downvote.setAttribute("onclick", `UserReviewVoteDown(${loggedIn}, "${loginURL}", "${id}");`);
                funny.setAttribute("onclick", `UserReviewVoteTag(${loggedIn}, "${loginURL}", "${id}");`);
                award.setAttribute("onclick", `UserReview_Award(${loggedIn}, "${loginURL}", "${id}", OnUserReviewAward);`);
            }
        });
    }

    async _getReviews() {

        Page.runInPageContext((processing, wait) => {
            window.SteamFacade.showBlockingWaitDialog(processing, wait);
        }, [Localization.str.processing, Localization.str.wait]);

        try {
            this._reviews = await Background.action("reviews", this._path, this._pages, this._reviewUpdated);

            this._reviewUpdated = false;
        } finally {

            // Delay half a second to avoid dialog flicker when grabbing cache
            await TimeUtils.timer(500);

            Page.runInPageContext(() => {
                window.SteamFacade.dismissActiveModal();
            });
        }
    }

    _getSetAwardType(node) {
        return (node.dataset.reaction ??= node.querySelector("img").src.match(/\/still\/(\d+)\.png/)[1]);
    }

    _patchReviewAwards() {

        // Add data attribute for award type (leaving out award count since it's redundant)
        for (const award of document.querySelectorAll(".review_award:not(.more_btn)")) {
            this._getSetAwardType(award);
        }

        // Patch `OnUserReviewAward` function to avoid reloading the page after giving an award
        Page.runInPageContext(() => {
            // Naively check if Steam has updated the function
            const oldFn = window.SteamFacade.global("OnUserReviewAward");
            if (typeof oldFn !== "function" || oldFn.toString().length !== 73) {
                return;
            }

            // Based on `OnRecommendationAward` from game.js and `Forum_OnCommunityAwardGranted` from forum.js
            window.SteamFacade.globalSet("OnUserReviewAward", (id, reaction) => {
                const review = document.querySelector(`[id$="${id}"`).closest(".review_box");

                let awardsCtn = review.querySelector(".review_award_ctn");
                if (awardsCtn === null) {
                    awardsCtn = document.createElement("div");
                    awardsCtn.classList.add("review_award_ctn");
                    review.querySelector(".header").append(awardsCtn);
                }

                const existingAward = Array.from(awardsCtn.querySelectorAll(".review_award"))
                    .find(node => Number(node.dataset.reaction) === reaction);

                if (existingAward) {
                    const countEl = existingAward.querySelector(".review_award_count");
                    const count = Number(countEl.textContent.trim());
                    countEl.textContent = count + 1;
                    countEl.classList.remove("hidden");

                    awardsCtn.prepend(existingAward);
                } else {
                    const award = document.createElement("div");
                    award.classList.add("review_award");

                    const img = document.createElement("img");
                    img.classList.add("review_award_icon", "tooltip");
                    img.src = `https://store.cloudflare.steamstatic.com/public/images/loyalty/reactions/still/${reaction}.png`;
                    award.append(img);

                    const countEl = document.createElement("span");
                    countEl.classList.add("review_award_count");
                    countEl.textContent = 1;
                    award.append(countEl);

                    award.dataset.reaction = reaction;

                    awardsCtn.prepend(award);

                    const moreEl = awardsCtn.querySelector(".more_btn");
                    if (moreEl) {
                        const countEl = moreEl.querySelector(".review_award_count");
                        const count = Number(countEl.textContent.trim());
                        countEl.textContent = count + 1;
                    } else {
                        awardsCtn.classList.add("show_all_awards");
                    }
                }

                window.Messenger.postMessage("updateReview");
            });
        });
    }
}
