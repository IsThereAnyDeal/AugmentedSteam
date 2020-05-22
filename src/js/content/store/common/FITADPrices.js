class FITADPrices extends ASFeature {
    checkPrerequisites() {
        return SyncedStorage.get("showlowestprice");
    }

    apply() {
        let prices = new Prices();

        prices.subids = this.context.getAllSubids();

        prices.bundleids = [];
        for (let node of document.querySelectorAll("[data-ds-bundleid]")) {
            prices.bundleids.push(node.dataset.dsBundleid);
        }

        prices.priceCallback = function(type, id, contentNode) {
            let node;
            let placement = "afterbegin";
            if (type === "sub") {
                node = document.querySelector(`input[name=subid][value="${id}"]`).parentNode.parentNode.parentNode;
            } else if (type === "bundle") {
                node = document.querySelector(`.game_area_purchase_game_wrapper[data-ds-bundleid="${id}"]`);
                if (!node) {
                    node = document.querySelector(`.game_area_purchase_game[data-ds-bundleid="${id}"]`);
                    placement = "beforebegin";
                } else {
                    // Move any "Complete your Collection!" banner out of the way
                    let banner = node.querySelector(".ds_completetheset");
                    let newParent = node.querySelector(".game_area_purchase_game");
                    if (banner && newParent) {
                        newParent.appendChild(banner);
                    }
                }
            }

            node.insertAdjacentElement(placement, contentNode);
        };

        prices.bundleCallback = function(html) {

            HTML.afterEnd("#game_area_purchase",
                `<h2 class="gradientbg es_bundle_info">${Localization.str.bundle.header} <img src="//store.steampowered.com/public/images/v5/ico_external_link.gif"></h2>
                ${html}`);
        };

        prices.load();
    }
}