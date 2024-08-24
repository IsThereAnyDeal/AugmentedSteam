(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {title, desc, strCancel, strLocalStorage} = params;

    const modal = ShowConfirmDialog(title, desc, strLocalStorage, strCancel);

    // Avoid releasing Enter (could be from the previous notes dialog) from auto-confirming selection
    $J(document).off("keyup.SharedConfirmDialog");

    modal
        .done(res => document.dispatchEvent(new CustomEvent("storageOption", {detail: res})))
        .fail(() => document.dispatchEvent(new CustomEvent("storageOption", {detail: null})));
})();
