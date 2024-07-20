(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {appids} = params;

    for (const appid of appids) {
        GStoreItemData.BindHoverEvents($J(`#recommended_block_content > a[data-ds-appid="${appid}"]`), appid);
    }

    GDynamicStore.DecorateDynamicItems($J("#recommended_block_content > a.es_sp_similar"));
})();
