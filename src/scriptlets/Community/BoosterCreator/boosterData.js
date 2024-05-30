
(function(){
    const data = JSON.parse(JSON.stringify(window.CBoosterCreatorPage.sm_rgBoosterData));
    document.dispatchEvent(new CustomEvent("as_boosterData", {detail: data}));
})();
