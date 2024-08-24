import {__tradeoffer_numItem, __tradeoffer_numItems} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CTradeOffer from "@Content/Features/Community/TradeOffer/CTradeOffer";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import "./FCountTradeItems.css";

export default class FCountTradeItems extends Feature<CTradeOffer> {

    override apply(): void {

        HTML.afterEnd(
            document.querySelector("#your_slots")!.parentElement!,
            '<div id="your_slots_count" class="trade_item_box"><span id="your_items_count"></span></div>'
        );
        HTML.afterEnd(
            document.querySelector("#their_slots")!.parentElement!,
            '<div id="their_slots_count" class="trade_item_box"><span id="their_items_count"></span></div>'
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
                        document.querySelector<HTMLElement>("#your_slots_count")!.style.display = "block";
                    } else {
                        document.querySelector<HTMLElement>("#your_slots_count")!.style.display = "none";
                    }

                    const theirItems = document.querySelectorAll("#their_slots .has_item").length;
                    if (theirItems > 0) {
                        theirItemsCountNode.textContent = L(theirItems === 1 ? __tradeoffer_numItem : __tradeoffer_numItems, {
                            "num": theirItems
                        });
                        document.querySelector<HTMLElement>("#their_slots_count")!.style.display = "block";
                    } else {
                        document.querySelector<HTMLElement>("#their_slots_count")!.style.display = "none";
                    }

                    if (yourItems === theirItems) {
                        yourItemsCountNode.className = "es_same";
                        theirItemsCountNode.className = "es_same";
                    } else if (yourItems > theirItems) {
                        yourItemsCountNode.className = "es_higher";
                        theirItemsCountNode.className = "es_lower";
                    } else {
                        yourItemsCountNode.className = "es_lower";
                        theirItemsCountNode.className = "es_higher";
                    }
                }
            }
        }).observe(document, {"subtree": true, "childList": true});
    }
}
