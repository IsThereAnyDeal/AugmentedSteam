(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {collapseName, shouldCollapse} = params;

    /*
     * https://github.com/SteamDatabase/SteamTracking/blob/a4cdd621a781f2c95d75edecb35c72f6781c01cf/store.steampowered.com/public/javascript/searchpage.js#L927
     * InitAutocollapse
     */
    const prefs = GetCollapsePrefs();

    const block = $J(`.search_collapse_block[data-collapse-name="${collapseName}"]`);
    let collapsed;

    if (typeof prefs[collapseName] === "undefined") {
        prefs[collapseName] = false;
        collapsed = false;
    } else {
        collapsed = prefs[collapseName];
    }

    collapsed = collapsed && shouldCollapse;

    block.children(".block_content").css("height", "");

    if (collapsed) {
        block.addClass("collapsed");
        block.children(".block_content").hide();
    }

    block.children(".block_header").on("click", () => {
        if (block.hasClass("collapsed")) {
            prefs[collapseName] = false;
            block.children(".block_content").slideDown("fast");
        } else {
            prefs[collapseName] = true;
            block.children(".block_content").slideUp("fast");
        }

        block.toggleClass("collapsed");
        SaveCollapsePrefs(prefs);
    });
})();
