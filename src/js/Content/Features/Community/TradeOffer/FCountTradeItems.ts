import {__tradeoffer_numItem, __tradeoffer_numItems} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CTradeOffer from "@Content/Features/Community/TradeOffer/CTradeOffer";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";

export default class FCountTradeItems extends Feature<CTradeOffer> {

    override checkPrerequisites(): boolean {
        return document.querySelector(".error_page_links") === null;
    }

    override apply(): void {

        HTML.afterEnd(
            document.querySelector("#your_slots")!.parentNode as HTMLElement,
            '<div id="your_slots_count" class="trade_item_box"><span id="your_items_count"></span></div>',
        );
        HTML.afterEnd(
            document.querySelector("#their_slots")!.parentNode as HTMLElement,
            "<div id='their_slots_count' class='trade_item_box'><span id='their_items_count'></span></div>",
        );

        new MutationObserver(mutations => {

            for (const mutation of mutations) {

                for (const node of mutation.addedNodes as NodeListOf<HTMLElement>) {

                    if (!node.classList || !node.classList.contains("item")) { continue; }

                    const yourItemsCountNode = document.querySelector("#your_items_count")!;
                    const theirItemsCountNode = document.querySelector("#their_items_count")!;

                    const yourItems = document.querySelectorAll("#your_slots .has_item").length;
                    if (yourItems > 0) {
                        yourItemsCountNode.textContent = L(yourItems === 1 ? __tradeoffer_numItem : __tradeoffer_numItems, {
                            "num": yourItems
                        });
                        document.querySelector<HTMLElement>("#your_slots_count")!.style.display = "block"; // TODO slideDown
                    } else {
                        document.querySelector<HTMLElement>("#your_slots_count")!.style.display = "none"; // TODO slideUp
                    }

                    const theirItems = document.querySelectorAll("#their_slots .has_item").length;
                    if (theirItems > 0) {
                        theirItemsCountNode.textContent = L(theirItems === 1 ? __tradeoffer_numItem : __tradeoffer_numItems, {
                            "num": theirItems
                        });
                        document.querySelector<HTMLElement>("#their_slots_count")!.style.display = "block"; // TODO slideDown
                    } else {
                        document.querySelector<HTMLElement>("#their_slots_count")!.style.display = "none"; // TODO slideUp
                    }

                    yourItemsCountNode.className = "";
                    theirItemsCountNode.className = "";

                    if (yourItems === theirItems) {
                        yourItemsCountNode.classList.add("es_same");
                        theirItemsCountNode.classList.add("es_same");
                    } else if (yourItems > theirItems) {
                        yourItemsCountNode.classList.add("es_higher");
                        theirItemsCountNode.classList.add("es_lower");
                    } else {
                        yourItemsCountNode.classList.add("es_lower");
                        theirItemsCountNode.classList.add("es_higher");
                    }
                }
            }
        }).observe(document, {"subtree": true, "childList": true});
    }
}
