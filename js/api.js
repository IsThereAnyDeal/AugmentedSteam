
let Api = {

    getApiUrl: function(endpoint, query) {

        let queryString = "";
        if (query) {
            queryString = "?" + Object.entries(query)
                .map(pair => pair.map(encodeURIComponent).join("="))
                .join("&");
        }

        return "//" + Config.ApiServerHost + "/" + endpoint + "/" + queryString;
    }

};
