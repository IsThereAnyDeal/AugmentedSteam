(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {handler, detail} = params

    document.dispatchEvent(new CustomEvent(handler, {detail}));
})();
