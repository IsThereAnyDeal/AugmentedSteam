(function(){
    const updateOld = window.CWishlistController.prototype.Update;

    window.CWishlistController.prototype.Update = function(...args) {
        updateOld.call(this, args);
        document.dispatchEvent(new CustomEvent("wlUpdate"));
    };
})();
