/*
 * Modified version of GrindIntoGoo from badges.js
 * https://github.com/SteamDatabase/SteamTracking/blob/ca5145acba077bee42de2593f6b17a6ed045b5f6/steamcommunity.com/public/javascript/badges.js#L521
 */
(function() {
    const params = JSON.parse(document.currentScript.dataset.params);
    const {sessionId, assetId, appid} = params;

    const data = {
        sessionid: sessionId,
        appid,
        assetid: assetId,
        contextid: 6
    };

    const profileUrl = f.global("g_strProfileURL");

    $J.get(`${profileUrl}/ajaxgetgoovalue/`, data).done(data => {
        // eslint-disable-next-line camelcase
        data.goo_value_expected = data.goo_value;

        $J.post(`${profileUrl}/ajaxgrindintogoo/`, data)
            .done(() => {
                ReloadCommunityInventory();
            });
    });
})();
