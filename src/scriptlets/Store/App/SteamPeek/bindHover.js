(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {appid} = params;

    GStoreItemData.BindHoverEvents($J("#recommended_block_content > a:last-of-type"), appid);
})();
