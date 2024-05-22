(function(){
    /*
     * Run our customizer when GHomepage.bInitialRenderComplete is set to `true`
     * https://github.com/SteamDatabase/SteamTracking/blob/d22d8df5db80e844f7ae1157dbb8b59532dfe4f8/store.steampowered.com/public/javascript/home.js#L432
     */
    if (GHomepage.bInitialRenderComplete) {
        document.dispatchEvent(new CustomEvent("renderComplete"));
        return;
    }

    GHomepage = new Proxy(GHomepage, {
        set(target, prop, value, ...args) {
            if (prop === "bInitialRenderComplete" && value === true) {
                document.dispatchEvent(new CustomEvent("renderComplete"));
            }

            return Reflect.set(target, prop, value, ...args);
        }
    });
})();
