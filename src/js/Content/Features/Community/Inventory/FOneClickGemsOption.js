import {Localization, SyncedStorage} from "../../../../modulesCore";
import {CallbackFeature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FOneClickGemsOption extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myInventory && SyncedStorage.get("show1clickgoo");
    }

    callback({view, sessionId, assetId, appid}) {

        // scrap link is always present, replace the link to avoid attaching multiple listeners
        const scrapLink = document.getElementById(`iteminfo${view}_item_scrap_link`);
        const newScrapLink = scrapLink.cloneNode(true);
        scrapLink.replaceWith(newScrapLink);

        newScrapLink.querySelector("span").textContent = Localization.str.oneclickgoo;

        newScrapLink.addEventListener("click", e => {
            e.preventDefault();

            /*
             * Modified version of GrindIntoGoo from badges.js
             * https://github.com/SteamDatabase/SteamTracking/blob/ca5145acba077bee42de2593f6b17a6ed045b5f6/steamcommunity.com/public/javascript/badges.js#L521
             */
            Page.runInPageContext((sessionid, assetid, appid) => {
                const f = window.SteamFacade;

                const params = {
                    sessionid,
                    appid,
                    assetid,
                    "contextid": 6
                };

                const profileUrl = f.global("g_strProfileURL");

                f.jqGet(`${profileUrl}/ajaxgetgoovalue/`, params).done(data => {
                    // eslint-disable-next-line camelcase
                    params.goo_value_expected = data.goo_value;

                    f.jqPost(`${profileUrl}/ajaxgrindintogoo/`, params).done(() => {
                        f.reloadCommunityInventory();
                    });
                });
            }, [sessionId, assetId, appid]);
        });
    }
}
