import {HTML, Localization} from "../../../../modulesCore";
import {CallbackFeature, RequestData, User} from "../../../modulesContent";

export default class FSetBackgroundOption extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myInventory;
    }

    async callback({view, assetId, contextId, globalId}) {

        const thisItem = document.getElementById(`${globalId}_${contextId}_${assetId}`);
        const itemActions = document.getElementById(`iteminfo${view}_item_actions`);

        if (itemActions.querySelector(".es_set_background")) { return; }

        // Make sure the selected item is a background
        const viewFullBtn = itemActions.querySelector("a");
        const m = viewFullBtn && viewFullBtn.href.match(/images\/(items\/\d+\/[a-z0-9.]+)/i);
        const bgUrl = m && m[1];
        if (!bgUrl) { return; }

        // Get owned backgrounds and the communityitemid for equipped background
        if (!this.profileBgsOwned) {

            this.userToken = await User.getUserToken();

            try {
                const [equipped, owned] = await Promise.all([
                    RequestData.getJson(`https://api.steampowered.com/IPlayerService/GetProfileItemsEquipped/v1?access_token=${this.userToken}&steamid=${User.steamId}`, {"credentials": "omit"}),
                    RequestData.getJson(`https://api.steampowered.com/IPlayerService/GetProfileItemsOwned/v1?access_token=${this.userToken}`, {"credentials": "omit"})
                ]);

                this.profileBgItemId = equipped.response.profile_background.communityitemid; // undefined if background unset
                this.profileBgsOwned = owned.response.profile_backgrounds;
            } catch (err) {
                console.error(err);
                return;
            }
        }

        // Find the communityitemid for selected background
        if (!thisItem.dataset.communityitemid) {

            const bg = this.profileBgsOwned.find(bg => bg.image_large === bgUrl);
            if (!bg) {
                console.error("Failed to find communityitemid for selected background");
                return;
            }

            thisItem.dataset.communityitemid = bg.communityitemid;
        }

        // Make sure the background we are trying to set is not set already
        const linkClass = thisItem.dataset.communityitemid === this.profileBgItemId ? "btn_disabled" : "";

        HTML.afterEnd(viewFullBtn,
            `<a class="es_set_background btn_small btn_darkblue_white_innerfade ${linkClass}">
                <span>${Localization.str.set_as_background}</span>
            </a>`);

        // TODO Add prompt so users can set equip options for the background through IPlayerService/SetEquippedProfileItemFlags
        itemActions.querySelector(".es_set_background").addEventListener("click", async e => {
            e.preventDefault();
            const el = e.target.closest(".es_set_background");

            if (el.classList.contains("es_background_loading") || el.classList.contains("btn_disabled")) { return; }
            el.classList.add("es_background_loading");

            const formData = new FormData();
            formData.append("communityitemid", thisItem.dataset.communityitemid);

            try {
                await RequestData.post(`https://api.steampowered.com/IPlayerService/SetProfileBackground/v1?access_token=${this.userToken}`, formData, {"credentials": "omit"});

                el.classList.add("btn_disabled");
                this.profileBgItemId = thisItem.dataset.communityitemid;
            } catch (err) {
                console.error("Failed to set selected background", err);
            } finally {
                el.classList.remove("es_background_loading");
            }
        });
    }
}
