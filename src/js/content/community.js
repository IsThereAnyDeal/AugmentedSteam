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

class MyWorkshopClass {
    constructor() {
        MyWorkshopClass.addFileSizes();
        MyWorkshopClass.addTotalSizeButton();
    }

    static getFileSizeStr(size) {
        let units = ["TB", "GB", "MB", "KB"];

        let index = units.findIndex((unit, i) =>
            size / Math.pow(1000, units.length - (i + 1)) >= 1
        );
        return `${(size / Math.pow(1000, units.length - (index + 1))).toFixed(2)} ${units[index]}`;
    }

    static async addFileSizes() {
        for (let node of document.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
            if (node.classList.contains("sized")) { continue; }
            
            let id = node.id.replace("Subscription", "");
            let size = await Background.action("workshopfilesize", id, true);
            if (typeof size !== "number") { continue; }

            let str = Localization.str.calc_workshop_size.file_size.replace("__size__", MyWorkshopClass.getFileSizeStr(size));
            let details = node.querySelector(".workshopItemSubscriptionDetails");
            HTML.beforeEnd(details, `<div class="workshopItemDate">${str}</div>`)
            node.classList.add("sized");
        }
    }

    static addTotalSizeButton() {
        let url = new URL(window.location.href);
        if (!url.searchParams || url.searchParams.get("browsefilter") !== "mysubscriptions") { return; }

        let panel = document.querySelector(".primary_panel");
        HTML.beforeEnd(panel,
            `<div class="menu_panel">
                <div class="rightSectionHolder">
                    <div class="rightDetailsBlock">
                        <span class="btn_grey_steamui btn_medium" id="es_calc_size">
                            <span>${Localization.str.calc_workshop_size.calc_size}</span>
                        </span>
                    </div>
                </div>
            </div>`);
        
        document.querySelector("#es_calc_size").addEventListener("click", async () => {
            ExtensionLayer.runInPageContext((calculating, totalSize) => {
                ShowBlockingWaitDialog(calculating, totalSize);
            },
            [
                Localization.str.calc_workshop_size.calculating,
                Localization.str.calc_workshop_size.total_size.replace("__size__", "0 KB"),
            ]);

            let totalStr = document.querySelector(".workshopBrowsePagingInfo").innerText.match(/\d+[,\d]*/g).pop();
            let total = Number(totalStr.replace(/,/g, ""));
            let parser = new DOMParser();
            let totalSize = 0;

            for (let p = 1; p <= Math.ceil(total / 30); p++) {
                url.searchParams.set("p", p);
                url.searchParams.set("numperpage", 30);

                let result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
                if (!result) {
                    console.error("Failed to request " + url.toString());
                    continue;
                }

                let doc = parser.parseFromString(result, "text/html");
                for (let item of doc.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
                    let id = item.id.replace("Subscription", "");
                    let size;

                    try {
                        size = await Background.action("workshopfilesize", id);
                    } catch(err) {
                        console.group("Workshop file sizes");
                        console.error(`Couldn't get file size for item ID ${id}`);
                        console.error(err);
                        console.groupEnd();
                    }
    
                    if (!size) { continue; }

                    totalSize += size;
                    
                    ExtensionLayer.runInPageContext((calculating, totalSize) => {
                        CModal.DismissActiveModal();
                        ShowBlockingWaitDialog(calculating, totalSize);
                    },
                    [
                        Localization.str.calc_workshop_size.calculating,
                        Localization.str.calc_workshop_size.total_size.replace("__size__", MyWorkshopClass.getFileSizeStr(totalSize)),
                    ]);
                }
            }

            MyWorkshopClass.addFileSizes();
            ExtensionLayer.runInPageContext((finished, totalSize) => {
                CModal.DismissActiveModal();
                ShowAlertDialog(finished, totalSize);
            },
            [
                Localization.str.calc_workshop_size.finished,
                Localization.str.calc_workshop_size.total_size.replace("__size__", MyWorkshopClass.getFileSizeStr(totalSize)),
            ]);
        });
    };
}

class SharedFilesPageClass {
    constructor() {
        new MediaPage().workshopPage();
        //media.initHdPlayer();
    }
}

let WorkshopBrowseClass = (function(){

    function WorkshopBrowseClass() {
        this.addSubscriberButtons();
    }

    WorkshopBrowseClass.prototype.addSubscriberButtons = function() {
        if (!User.isSignedIn) { return; }

        let appid = GameId.getAppidUriQuery(window.location.search);
        if (!appid) { return; }

        let pagingInfo = document.querySelector(".workshopBrowsePagingInfo");
        if (!pagingInfo) { return; }

        let workshopStr = Localization.str.workshop;

        HTML.beforeBegin(".panel > .rightSectionTopTitle",
            `<div class="rightSectionTopTitle">${workshopStr.subscriptions}:</div>
            <div id="es_subscriber_container" class="rightDetailsBlock">
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="subscribe">${workshopStr.subscribe_all}</a>
                    </div>
                </div>
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="unsubscribe">${workshopStr.unsubscribe_all}</a>
                    </div>
                </div>
                <hr>
            </div>`);

        document.querySelector("#es_subscriber_container").addEventListener("click", e => {
            let method = e.target.closest(".es_subscriber").dataset.method;
            let total = Math.max(...pagingInfo.textContent.replace(/,/g, "").match(/\d+/g));

            startSubscriber(method, total);
        });

        async function startSubscriber(method, total) {
            let completed = 0;
            let failed = 0;

            let statusTitle = workshopStr[method + "_all"];
            let statusString = workshopStr[method + "_confirm"]
                .replace("__count__", total);

            function updateWaitDialog() {
                let statusString = workshopStr[method + "_loading"]
                    .replace("__i__", completed)
                    .replace("__count__", total);

                if (failed) {
                    statusString += workshopStr.failed.replace("__n__", failed);
                }

                let modal = document.querySelector(".newmodal_content");
                if (!modal) {
                    let statusTitle = workshopStr[method + "_all"];
                    ExtensionLayer.runInPageContext((title, progress) => {
                        if (window.dialog) {
                            window.dialog.Dismiss();
                        }
                        
                        window.dialog = ShowBlockingWaitDialog(title, progress);
                    }, [ statusTitle, statusString ]);
                } else {
                    modal.innerText = statusString;
                }
            }

            function showResults() {
                let statusTitle = workshopStr[method + "_all"];
                let statusString = workshopStr.finished
                    .replace("__success__", completed - failed)
                    .replace("__fail__", failed);

                ExtensionLayer.runInPageContext((title, finished) => {
                    if (window.dialog) {
                        window.dialog.Dismiss();
                    }
                    
                    window.dialog = ShowConfirmDialog(title, finished)
                        .done(result => {
                            if (result === "OK") {
                                window.location.reload();
                            }
                        });
                }, [ statusTitle, statusString ]);
            }

            function changeSubscription(id) {
                let formData = new FormData();
                formData.append("sessionid", User.getSessionId());
                formData.append("appid", appid);
                formData.append("id", id);

                return RequestData.post("https://steamcommunity.com/sharedfiles/" + method, formData, {
                    withCredentials: true
                }, true)
                .then(function(res) {
                    if (!res || !res.success) {
                        throw new Error("Bad response");
                    }
                })
                .catch(function(err) {
                    failed++;
                    console.error(err);
                })
                .finally(function() {
                    completed++;
                    updateWaitDialog();
                });
            }

            // todo reject when dialog closed
            await ExtensionLayer.runInPageContext((title, confirm) => {
                let prompt = ShowConfirmDialog(title, confirm);

                return new Promise(resolve => {
                    prompt.done(result => {
                        if (result === "OK") {
                            resolve();
                        }
                    });
                });
                
            }, [ statusTitle, statusString ], "startSubscriber");

            updateWaitDialog();

            function canSkip(method, node) {
                if (method === "subscribe") {
                    return node && node.style.display !== "none";
                }

                if (method === "unsubscribe") {
                    return !node || node.style.display === "none";
                }

                return false;
            }

            let parser = new DOMParser();
            let workshopItems = [];
            for (let p = 1; p <= Math.ceil(total / 30); p++) {
                let url = new URL(window.location.href);
                url.searchParams.set("p", p);
                url.searchParams.set("numperpage", 30);

                let result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
                if (!result) {
                    console.error("Failed to request " + url.toString());
                    continue;
                }

                let xmlDoc = parser.parseFromString(result, "text/html");
                for (let node of xmlDoc.querySelectorAll(".workshopItem")) {
                    let subNode = node.querySelector(".user_action_history_icon.subscribed");
                    if (canSkip(method, subNode)) { continue; }
                
                    node = node.querySelector(".workshopItemPreviewHolder");
                    workshopItems.push(node.id.replace("sharedfile_", ""))
                }
            }

            total = workshopItems.length;
            updateWaitDialog();

            return Promise.all(workshopItems.map(id => changeSubscription(id)))
                .finally(showResults);
        }
    };

    return WorkshopBrowseClass;
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

        case /^\/(?:id|profiles)\/.+\/myworkshopfiles\/?$/.test(path):
            (new MyWorkshopClass());
            break;

        case /^\/sharedfiles\/filedetails\/?$/.test(path):
            (new SharedFilesPageClass());
            break;

        case /^\/workshop\/browse/.test(path):
            (new WorkshopBrowseClass());
            break;

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
