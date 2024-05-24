(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const subids = params.subids;
    const bundleid = undefined;
    const navdata = undefined;

    window.AddItemToCart(subids.length === 1 ? subids[0] : subids, bundleid, navdata);
})();
