(function(){
    $J(document).ajaxComplete((e, xhr, {url}) => {
        const method = (url.endsWith("/") ? url.slice(0, -1) : url).split("/").pop();
        if (method === "addtowishlist" || method === "removefromwishlist") {
            const response = JSON.parse(xhr.responseText);
            document.dispatchEvent(new CustomEvent("addRemoveWishlist", {detail: response.success}));
        }
    });
})();
