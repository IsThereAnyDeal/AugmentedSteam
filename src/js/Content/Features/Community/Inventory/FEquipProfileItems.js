import {HTML, Localization} from "../../../../modulesCore";
import {CallbackFeature, RequestData, User} from "../../../modulesContent";

export default class FEquipProfileItems extends CallbackFeature {

    checkPrerequisites() {
        return this.context.myInventory;
    }

    callback({view, assetId, appid, itemType}) {

        // Make sure the selected item is equippable (those returned by the /IPlayerService/GetProfileItemsEquipped/ endpoint)
        let apiPath;
        switch (itemType) {
            case "profilebackground":
                apiPath = "/IPlayerService/SetProfileBackground/v1/";
                break;
            case "profilemodifier":
                apiPath = "/IQuestService/ActivateProfileModifierItem/v1/";
                break;
            case "miniprofilebackground":
                apiPath = "/IPlayerService/SetMiniProfileBackground/v1/";
                break;
            case "avatarframe":
                apiPath = "/IPlayerService/SetAvatarFrame/v1/";
                break;
            case "animatedavatar":
                apiPath = "/IPlayerService/SetAnimatedAvatar/v1/";
                break;
            case "keyboardskin":
                apiPath = "/IPlayerService/SetSteamDeckKeyboardSkin/v1/";
                break;
            default:
                return;
        }

        const btn = HTML.toElement(
            `<a class="btn_small btn_darkblue_white_innerfade">
                <span>${Localization.str.equip_on_profile}</span>
            </a>`
        );

        if (itemType === "profilebackground") {
            document.getElementById(`iteminfo${view}_item_actions`).append(btn);
        } else {
            document.getElementById(`iteminfo${view}_item_owner_actions`).replaceChildren(btn);
        }

        // TODO Add checkbox so users can set equip options for the background through /IPlayerService/SetEquippedProfileItemFlags/
        btn.addEventListener("click", async e => {
            e.preventDefault();

            if (btn.classList.contains("es_equip_loading") || btn.classList.contains("btn_disabled")) { return; }
            btn.classList.add("es_equip_loading");

            const formData = new FormData();

            /*
             * Note: For duplicate items, assetId won't be the same, and the /IPlayerService/GetProfileItemsOwned/ endpoint
             * will only return one of them (the first one obtained maybe?), but any of them will work for equipping.
             */
            formData.append("communityitemid", assetId);

            if (itemType === "profilemodifier") {
                formData.append("appid", appid);
                formData.append("activate", true);
            }

            try {
                const token = await User.accessToken;
                await RequestData.post(`https://api.steampowered.com${apiPath}?access_token=${token}`, formData, {"credentials": "omit"});

                btn.classList.add("btn_disabled");
            } catch (err) {
                console.error("Failed to equip selected item", err);
            } finally {
                btn.classList.remove("es_equip_loading");
            }
        });
    }
}
