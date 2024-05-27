(function(){
    const params = JSON.parse(document.currentScript.dataset.params);

    document.dispatchEvent("as_queryString", {
        detail: Object.toQueryString(params)
    });
})();
