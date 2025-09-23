(function(){
    document.addEventListener("visibilitychange", function(){
        if (document.hidden) {
            Object.defineProperty(document, 'visibilityState', {value: 'visible', writable: true});
            Object.defineProperty(document, 'hidden', {value: false, writable: true});
            document.dispatchEvent(new Event("visibilitychange"));
        }
    });
})();