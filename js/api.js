
let Api = {

    getApiUrl: function(endpoint, query) {

        let queryString = "";
        if (query) {
            queryString = "?" + Object.entries(query)
                .map(pair => pair.map(encodeURIComponent).join("="))
                .join("&");
        }

        console.log("Call "+ "//" + Config.ApiServerHost + "/" + endpoint + queryString);
        return "//" + Config.ApiServerHost + "/" + endpoint + queryString;
    }

};
