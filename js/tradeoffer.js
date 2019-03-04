
let TradeOfferPageClass = (function(){
    
    function TradeOfferPageClass() {
        this.countItems();
    }
    
    TradeOfferPageClass.prototype.countItems = function() {
        document.querySelector("#your_slots").parentNode.insertAdjacentHTML("afterend", "<div id='your_slots_count' class='trade_item_box'><span id='your_items_count'></span></div>");
        document.querySelector("#their_slots").parentNode.insertAdjacentHTML("afterend", "<div id='their_slots_count' class='trade_item_box'><span id='their_items_count'></span></div>");
        
        let observer = new MutationObserver(mutations => {
            mutations.forEach(function(mutation) {
                for (let node of mutation.addedNodes) {
                    if (!node.classList || !node.classList.contains("item")) { continue; }
                    
                    let yourItemsCountNode = document.querySelector("#your_items_count");
                    let theirItemsCountNode = document.querySelector("#their_items_count");
                    
                    let yourItems = document.querySelectorAll("#your_slots .has_item").length;
                    if (yourItems > 0) {
                        let text = (yourItems === 1 ? Localization.str.tradeoffer.num_item : Localization.str.tradeoffer.num_items);
                        yourItemsCountNode.textContent = text.replace("__num__", yourItems);
                        document.querySelector("#your_slots_count").style.display = "block"; // TODO slideDown
                    } else {
                        document.querySelector("#your_slots_count").style.display = "none"; // TODO slideUp
                    }
                    
                    let theirItems = document.querySelectorAll("#their_slots .has_item").length;
                    if (theirItems > 0) {
                        let text = (theirItems === 1 ? Localization.str.tradeoffer.num_item : Localization.str.tradeoffer.num_items);
                        theirItemsCountNode.textContent = text.replace("__num__", theirItems);
                        document.querySelector("#their_slots_count").style.display = "block"; // TODO slideDown
                    } else {
                        document.querySelector("#their_slots_count").style.display = "none"; // TODO slideUp
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
            });
        });
        
        observer.observe(document, { subtree: true, childList: true });
    };
    
    return TradeOfferPageClass;
})();

(function(){
    SyncedStorage
    .load()
    .finally(() => Promise
    .all([Localization.promise()])
    .then(() => {
        (new TradeOfferPageClass());
    })
)
})();

