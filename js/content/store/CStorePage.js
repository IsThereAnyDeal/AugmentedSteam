class CStorePage extends ASContext {

    getAllSubids() {
        let result = [];
        for (let node of document.querySelectorAll("input[name=subid]")) {
            result.push(node.value);
        }
        return result;
    }

    // TODO(tfedor) maybe make properties instead of dynamic qheck of all of these "isXY"? Not sure
    isAppPage() {
        return /^\/app\/\d+/.test(window.location.pathname);
    }

    isDlc() {
        return Boolean(document.querySelector("div.game_area_dlc_bubble"));
    }

    isOwned() {
        return Boolean(document.querySelector(".game_area_already_owned"));
    }
}
