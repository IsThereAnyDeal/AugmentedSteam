let RecommendedPageClass = (function(){

    function RecommendedPageClass() {
        this.addReviewSort();
    }

    RecommendedPageClass.prototype.addReviewSort = async function() {
        let numReviewsNode = document.querySelector(".review_stat:nth-child(1) .giantNumber");
        if (!numReviewsNode) { return; }

        let numReviews = Number(numReviewsNode.innerText);
        if (isNaN(numReviews) || numReviews <= 1) { return; }

        let steamId = window.location.pathname.match(/\/((?:id|profiles)\/.+?)\//)[1];
        let params = new URLSearchParams(window.location.search);
        let curPage = params.get("p") || 1;
        let pageCount = 10;
        let reviews;

        async function getReviews() {

            let modalActive = false;

            // Delay half a second to avoid dialog flicker when grabbing cache
            let delayer = setTimeout(
                () => {
                    ExtensionLayer.runInPageContext(
                        (processing, wait) => { ShowBlockingWaitDialog(processing, wait); },
                        [
                            Localization.str.processing,
                            Localization.str.wait
                        ]);
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
                    ExtensionLayer.runInPageContext(() => {
                        CModal.DismissActiveModal();
                    });
                }
            }
        }

        async function sortReviews(sortBy, reverse) {
            if (!reviews) {
                await getReviews();
            }

            for (let node of document.querySelectorAll(".review_box")) {
                node.remove();
            }

            let displayedReviews = reviews.sort((a, b) => {
                switch(sortBy) {
                    case "rating":
                    case "helpful":
                    case "funny":
                    case "length":
                    case "playtime":
                        return b[sortBy] - a[sortBy];
                    case "visibility":
                        a = a[sortBy].toLowerCase();
                        b = b[sortBy].toLowerCase();
                        if (a > b) { return -1; }
                        if (a < b) { return 1; }
                        return 0;
                    case "default":
                        return a[sortBy] - b[sortBy];
                }
            });

            if (reverse) {
                displayedReviews.reverse();
            }

            displayedReviews = displayedReviews.slice(pageCount * (curPage - 1), pageCount * curPage);

            let footer = document.querySelector("#leftContents > .workshopBrowsePaging:last-child");
            for (let { node } of displayedReviews) {
                footer.insertAdjacentElement("beforebegin", HTMLParser.htmlToElement(node));
            }

            // Add back sanitized event handlers
            ExtensionLayer.runInPageContext(ids => {
                Array.from(document.querySelectorAll(".review_box")).forEach((node, boxIndex) => {
                    let id = ids[boxIndex];

                    let containers = node.querySelectorAll(".dselect_container");

                    // Only exists when the requested profile is yours (these are the input fields where you can change visibility and language of the review)
                    if (containers.length) {
                        for (let container of node.querySelectorAll(".dselect_container")) {
                            let type = container.id.startsWith("ReviewVisibility") ? "Visibility" : "Language";
                            let input = container.querySelector("input");
                            let trigger = container.querySelector(".trigger");
                            let selections = Array.from(container.querySelectorAll(".dropcontainer a"));

                            input.onchange = () => { window[`OnReview${type}Change`](id, `Review${type}${id}`) };

                            trigger.href = "javascript:DSelectNoop();"
                            trigger.onfocus = () => DSelectOnFocus(`Review${type}${id}`);
                            trigger.onblur = () => DSelectOnBlur(`Review${type}${id}`);
                            trigger.onclick = () => DSelectOnTriggerClick(`Review${type}${id}`);

                            selections.forEach((selection, selIndex) => {
                                selection.href = "javascript:DSelectNoop();";
                                selection.onmouseover = () => DHighlightItem(`Review${type}${id}`, selIndex, false);
                                selection.onclick = () => DHighlightItem(`Review${type}${id}`, selIndex, true);
                            });
                        }
                    // Otherwise you have buttons to vote for the review (Was it helpful or not, was it funny?)
                    } else {
                        let controlBlock = node.querySelector(".control_block");

                        let btns = controlBlock.querySelectorAll("a");
                        let [ upvote, downvote, funny ] = btns;

                        for (let btn of btns) {
                            btn.href = "javascript:void(0)";
                        }

                        upvote.onclick = () => UserReviewVoteUp(id);
                        downvote.onclick = () => UserReviewVoteDown(id);
                        funny.onclick = () => UserReviewVoteTag(id, 1, `RecommendationVoteTagBtn${id}_1`);
                    }
                });
            }, [ displayedReviews.map(review => review.id) ]);
        }

        Messenger.addMessageListener("updateReview", id => {
            Background.action("updatereviewnode", steamId, document.querySelector(`[id$="${id}"`).closest(".review_box").outerHTML, numReviews).then(getReviews);
        });

        ExtensionLayer.runInPageContext(() => {
            $J(document).ajaxSuccess((event, xhr, { url }) => {
                let pathname = new URL(url).pathname;
                if (pathname.startsWith("/userreviews/rate/") || pathname.startsWith("/userreviews/votetag/") || pathname.startsWith("/userreviews/update/")) {
                    let id = pathname.split('/').pop();
                    Messenger.postMessage("updateReview", id);
                }
            });
        });

        document.querySelector(".review_list h1").insertAdjacentElement("beforebegin",
            Sortbox.get("reviews", [
                ["default", Localization.str.date],
                ["rating", Localization.str.rating],
                ["helpful", Localization.str.helpful],
                ["funny", Localization.str.funny],
                ["length", Localization.str.length],
                ["visibility", Localization.str.visibility],
                ["playtime", Localization.str.playtime],
            ], SyncedStorage.get("sortreviewsby"), sortReviews, "sortreviewsby")
        );
    };

    return RecommendedPageClass;
})();

let EditGuidePageClass = (function(){

    function EditGuidePageClass() {
        this.allowMultipleLanguages();
        this.addCustomTags();
        this.rememberTags();
    }

    function addTag(name, checked=true) {
        name = HTML.escape(name);
        let attr = checked ? " checked" : "";
        let tag = `<div><input type="checkbox" name="tags[]" value="${name}" class="inputTagsFilter"${attr}>${name}</div>`;
        HTML.beforeBegin("#es_add_tag", tag);
    }

    EditGuidePageClass.prototype.allowMultipleLanguages = function() {
        document.getElementsByName("tags[]").forEach(tag => tag.type = "checkbox");
    };

    EditGuidePageClass.prototype.addCustomTags = function() {
        let langSection = document.querySelector("#checkboxgroup_1");
        if (!langSection) { return; }

        Messenger.addMessageListener("addtag", name => {
            addTag(name, true);
        });
        
        HTML.afterEnd(langSection,
            `<div class="tag_category_container" id="checkboxgroup_2">
                <div class="tag_category_desc">${Localization.str.custom_tags}</div>
                <div><a style="margin-top: 8px;" class="btn_blue_white_innerfade btn_small_thin" id="es_add_tag">
                    <span>${Localization.str.add_tag}</span>
                </a></div>
            </div>`);

        ExtensionLayer.runInPageContext((customTags, enterTag) => {
            $J("#es_add_tag").on("click", () => {
                let Modal = ShowConfirmDialog(customTags, 
                    `<div class="commentthread_entry_quotebox">
                        <textarea placeholder="${enterTag}" class="commentthread_textarea es_tag" rows="1"></textarea>
                    </div>`);
                
                let elem = $J(".es_tag");
                let tag = elem.val();

                function done() {
                    if (tag.trim().length === 0) { return; }
                    tag = tag[0].toUpperCase() + tag.slice(1);
                    Messenger.postMessage("addtag", tag);
                }

                elem.on("keydown paste input", e => {
                    tag = elem.val();
                    if (e.key === "Enter") {
                        Modal.Dismiss();
                        done();
                    }
                });

                Modal.done(done);
            });
        }, [ Localization.str.custom_tags, Localization.str.enter_tag ]);
    };

    EditGuidePageClass.prototype.rememberTags = function() {
        let submitBtn = document.querySelector("[href*=SubmitGuide]");
        if (!submitBtn) { return; }

        let params = new URLSearchParams(window.location.search);
        let curId = params.get("id") || "recent";
        let savedTags = LocalStorage.get("es_guide_tags", {});
        if (!savedTags[curId]) {
            savedTags[curId] = savedTags.recent || [];
        }

        for (let id in savedTags) {
            for (let tag of savedTags[id]) {
                let node = document.querySelector(`[name="tags[]"][value="${tag.replace(/"/g, "\\\"")}"]`);
                if (node && curId == id) {
                    node.checked = true;
                } else if (!node) {
                    addTag(tag, curId == id);
                }
            }
        }

        submitBtn.removeAttribute("href");
        submitBtn.addEventListener("click", function() {
            savedTags.recent = [];
            savedTags[curId] = Array.from(document.querySelectorAll("[name='tags[]']:checked")).map(node => node.value);
            LocalStorage.set("es_guide_tags", savedTags);
            ExtensionLayer.runInPageContext(() => { SubmitGuide(); });
        });
    };

    return EditGuidePageClass;
})();

(async function(){
    
    switch (true) {

        case /^\/sharedfiles\/editguide\/?$/.test(path):
            (new EditGuidePageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/recommended/.test(path):
            (new RecommendedPageClass());
            break;

        case /^\/tradingcards\/boostercreator/.test(path):
            ExtensionLayer.runInPageContext(gemWord => {
                $J("#booster_game_selector option").each(function() {
                    if ($J(this).val()) {
                        $J(this).append(` - ${CBoosterCreatorPage.sm_rgBoosterData[$J(this).val()].price} ${gemWord}`);
                    }
                });
            }, [ document.querySelector(".booster_creator_goostatus .goo_display").textContent.trim().replace(/[\d]+,?/g, "") ]);
            break;
    }
})();
