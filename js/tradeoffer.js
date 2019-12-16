function count_items() {
	$("#your_slots").parent().after("<div id='your_slots_count' class='trade_item_box'><span id='your_items_count'></span></div>");
	$("#their_slots").parent().after("<div id='their_slots_count' class='trade_item_box'><span id='their_items_count'></span></div>");

	var item_observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			for (var i = 0; i < mutation.addedNodes.length; i++) {
				var node = mutation.addedNodes[i];
				
				if (node.classList && node.classList.contains("item")) {
					var your_items = $("#your_slots").find(".has_item").length;
					if (your_items > 0) {
						if (your_items == 1) {
							$("#your_items_count").text(localized_strings.tradeoffer.num_item.replace("__num__", your_items));
						} else {
							$("#your_items_count").text(localized_strings.tradeoffer.num_items.replace("__num__", your_items));
						}
						$("#your_slots_count").slideDown();
					} else {
						$("#your_slots_count").slideUp();
					}

					var their_items = $("#their_slots").find(".has_item").length;
					if (their_items > 0) {
						if (their_items == 1) {
							$("#their_items_count").text(localized_strings.tradeoffer.num_item.replace("__num__", their_items));
						} else {
							$("#their_items_count").text(localized_strings.tradeoffer.num_items.replace("__num__", their_items));
						}
						$("#their_slots_count").slideDown();
					} else {
						$("#their_slots_count").slideUp();
					}

					if (your_items == their_items) {
						$("#your_items_count, #their_items_count").removeClass().addClass("es_same");
					} else {
						if (your_items > their_items) {
							$("#your_items_count").removeClass().addClass("es_higher");
							$("#their_items_count").removeClass().addClass("es_lower");
						} else {
							$("#your_items_count").removeClass().addClass("es_lower");
							$("#their_items_count").removeClass().addClass("es_higher");
						}
					}
				}
			}
		});
	});
	item_observer.observe(document, { subtree: true, childList: true });
}

$(document).ready(function(){
	$.when(localization_promise).done(function(){
		count_items();
	});
});
