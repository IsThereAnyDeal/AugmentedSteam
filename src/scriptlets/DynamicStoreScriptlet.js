
(function() {

    function onReady() {
        window.GDynamicStore.OnReady(() => {
            window.dispatchEvent(new CustomEvent("DSReady"));
        });
    }

    function invalidateCache() {
        // `GDynamicStore` is defined in dynamicstore.js
        if (typeof window.GDynamicStore === "undefined") {
            return;
        }

        const oldFunc = window.GDynamicStore.InvalidateCache;
        window.GDynamicStore.InvalidateCache = function(...args) {
            oldFunc.call(this, args);

            window.dispatchEvent(new CustomEvent("DSInvalidateCache"));
        };
    }

    document.addEventListener("as_DynamicStore", async function(e) {
        const {action} = e.detail;
        if (!action) {
            return;
        }

        switch(action) {
            case "invalidateCache":
                invalidateCache();
                break;
            case "onReady":
                onReady();
                break;
        }
    })
})();
