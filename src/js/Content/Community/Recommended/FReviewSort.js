import {HTMLParser, Localization, SyncedStorage} from "../../../modulesCore";
import {Background, Feature, Messenger, Sortbox} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FReviewSort extends Feature {

    apply() {

        const numReviewsNode = document.querySelector(".review_stat:nth-child(1) .giantNumber");
        if (!numReviewsNode) { return; }

        const numReviews = Number(numReviewsNode.innerText);
        if (isNaN(numReviews) || numReviews <= 1) { return; }

        const steamId = window.location.pathname.match(/\/((?:id|profiles)\/.+?)\//)[1];
        const params = new URLSearchParams(window.location.search);
        const curPage = params.get("p") || 1;
        const pageCount = 10;
        let reviews;

        async function getReviews() {

            let modalActive = false;

            // Delay half a second to avoid dialog flicker when grabbing cache
            const delayer = setTimeout(
                () => {
                    Page.runInPageContext(
                        (processing, wait) => { window.SteamFacade.showBlockingWaitDialog(processing, wait); },
                        [
                            Localization.str.processing,
                            Localization.str.wait
                        ]
                    );
                    modalActive = true;
                },
                500,
            );

            try {
                reviews = await Background.action("reviews", steamId, numReviews);

                reviews.map((review, i) => {
                    review.default = i;
                    return review;
                });
            } finally {
                clearTimeout(delayer);

                if (modalActive) {
                    Page.runInPageContext(() => {
                        window.SteamFacade.dismissActiveModal();
                    });
                }
            }
        }

        async function sortReviews(sortBy, reverse) {
            if (!reviews) {
                await getReviews();
            }

            for (const node of document.querySelectorAll(".review_box")) {
                node.remove();
            }

            let displayedReviews = reviews.sort((a, b) => {
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
                        // eslint-disable-next-line no-invalid-this -- this is binded to an instance of FReviewSort
                        this.logError(
                            new Error("Invalid sorting criteria"),
                            "Can't sort reviews by criteria '%s'",
                            sortBy,
                        );
                        return 0;
                }
            });

            if (reverse) {
                displayedReviews.reverse();
            }

            displayedReviews = displayedReviews.slice(pageCount * (curPage - 1), pageCount * curPage);

            const footer = document.querySelector("#leftContents > .workshopBrowsePaging:last-child");
            for (const {node} of displayedReviews) {
                footer.insertAdjacentElement("beforebegin", HTMLParser.htmlToElement(node));
            }

            // Add back sanitized event handlers
            Page.runInPageContext(ids => {
                Array.from(document.querySelectorAll(".review_box")).forEach((node, boxIndex) => {
                    const id = ids[boxIndex];

                    const containers = node.querySelectorAll(".dselect_container");

                    /*
                     * Only exists when the requested profile is yours (these are the input
                     * fields where you can change visibility and language of the review)
                     */
                    if (containers.length) {
                        for (const container of node.querySelectorAll(".dselect_container")) {
                            const type = container.id.startsWith("ReviewVisibility") ? "Visibility" : "Language";
                            const input = container.querySelector("input");
                            const trigger = container.querySelector(".trigger");
                            const selections = Array.from(container.querySelectorAll(".dropcontainer a"));

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

                    // Otherwise you have buttons to vote for the review (Was it helpful or not, was it funny?)
                    } else {
                        const controlBlock = node.querySelector(".control_block");

                        const btns = controlBlock.querySelectorAll("a");
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

        Messenger.addMessageListener("updateReview", id => {
            Background.action("updatereviewnode", steamId, document.querySelector(`[id$="${id}"`).closest(".review_box").outerHTML, numReviews).then(getReviews);
        });

        Page.runInPageContext(() => {
            window.SteamFacade.jq(document).ajaxSuccess((event, xhr, {url}) => {
                const pathname = new URL(url).pathname;
                if (pathname.startsWith("/userreviews/rate/")
                    || pathname.startsWith("/userreviews/votetag/")
                    || pathname.startsWith("/userreviews/update/")) {

                    const id = pathname.split("/").pop();
                    Messenger.postMessage("updateReview", id);
                }
            });
        });

        document.querySelector(".review_list h1").insertAdjacentElement(
            "beforebegin",
            Sortbox.get(
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
                sortReviews.bind(this),
                "sortreviewsby"
            )
        );
    }
}
