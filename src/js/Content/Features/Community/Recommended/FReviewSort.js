import {HTML, Localization, SyncedStorage, TimeUtils} from "../../../../modulesCore";
import {Background, Feature, Messenger, Sortbox} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FReviewSort extends Feature {

    checkPrerequisites() {
        return document.querySelectorAll(".review_box").length > 1;
    }

    apply() {

        const pagingInfo = document.querySelector(".workshopBrowsePagingInfo").textContent;
        this._numReviews = Math.max(...pagingInfo.replace(/,/g, "").match(/\d+/g));
        this._path = window.location.pathname.match(/\/((?:id|profiles)\/.+?)\//)[1];

        this._curPage = new URLSearchParams(window.location.search).get("p") || 1;
        this._pageCount = 10;

        Messenger.addMessageListener("updateReview", id => {
            Background.action("updatereviewnode", this._path, document.querySelector(`[id$="${id}"`).closest(".review_box").outerHTML, this._numReviews)
                .then(() => { this._getReviews(); });
        });

        Page.runInPageContext(() => {
            window.SteamFacade.jq(document).ajaxSuccess((event, xhr, {url}) => {
                const pathname = new URL(url).pathname;
                if (pathname.startsWith("/userreviews/rate/")
                    || pathname.startsWith("/userreviews/votetag/")
                    || pathname.startsWith("/userreviews/update/")) {

                    const id = pathname.split("/").pop();
                    window.Messenger.postMessage("updateReview", id);
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
            ],
            SyncedStorage.get("sortreviewsby"),
            (sortBy, reversed) => { this._sortReviews(sortBy, reversed); },
            "sortreviewsby"
        ));
    }

    async _sortReviews(sortBy, reversed) {

        if (!this._reviews) {
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
                case "playtime":
                    return b[sortBy] - a[sortBy];
                case "visibility": {
                    const _a = a[sortBy].toLowerCase();
                    const _b = b[sortBy].toLowerCase();
                    if (_a > _b) { return -1; }
                    if (_a < _b) { return 1; }
                    return 0;
                }
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
        Page.runInPageContext(ids => {
            document.querySelectorAll(".review_box").forEach((node, i) => {
                const id = ids[i];

                // Only exists when the requested profile is yours
                const containers = node.querySelectorAll(".dselect_container");

                if (containers.length > 0) {
                    for (const container of containers) {
                        const type = container.id.startsWith("ReviewVisibility") ? "Visibility" : "Language";
                        const input = container.querySelector("input");
                        const trigger = container.querySelector(".trigger");
                        const selections = container.querySelectorAll(".dropcontainer a");

                        input.onchange = () => { window[`OnReview${type}Change`](id, `Review${type}${id}`); };

                        /* eslint-disable no-script-url, no-undef, new-cap, no-loop-func --
                         * The D* functions are not actual references in this context,
                         * they're functions in the page context. */
                        trigger.href = "javascript:DSelectNoop();";
                        trigger.onfocus = () => DSelectOnFocus(`Review${type}${id}`);
                        trigger.onblur = () => DSelectOnBlur(`Review${type}${id}`);
                        trigger.onclick = () => DSelectOnTriggerClick(`Review${type}${id}`);

                        selections.forEach((selection, selIndex) => {
                            selection.href = "javascript:DSelectNoop();";
                            selection.onmouseover = () => DHighlightItem(`Review${type}${id}`, selIndex, false);
                            selection.onclick = () => DHighlightItem(`Review${type}${id}`, selIndex, true);
                        });
                        /* eslint-enable no-script-url, no-undef, new-cap, no-loop-func */
                    }

                // Otherwise you have buttons to vote for the review
                } else {
                    const btns = node.querySelectorAll(".control_block a");
                    const [upvote, downvote, funny] = btns;

                    for (const btn of btns) {
                        btn.href = "javascript:void(0)"; // eslint-disable-line no-script-url
                    }

                    /* eslint-disable new-cap, no-undef */
                    upvote.onclick = () => UserReviewVoteUp(id);
                    downvote.onclick = () => UserReviewVoteDown(id);
                    funny.onclick = () => UserReviewVoteTag(id, 1, `RecommendationVoteTagBtn${id}_1`);
                    /* eslint-enable new-cap, no-undef */
                }
            });
        }, [displayedReviews.map(review => review.id)]);
    }

    async _getReviews() {

        Page.runInPageContext((processing, wait) => {
            window.SteamFacade.showBlockingWaitDialog(processing, wait);
        }, [Localization.str.processing, Localization.str.wait]);

        try {
            this._reviews = await Background.action("reviews", this._path, this._numReviews);
        } finally {

            // Delay half a second to avoid dialog flicker when grabbing cache
            await TimeUtils.timer(500);

            Page.runInPageContext(() => {
                window.SteamFacade.dismissActiveModal();
            });
        }
    }
}
