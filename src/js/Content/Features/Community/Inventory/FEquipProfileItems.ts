import {__equipOnProfile} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CInventory from "@Content/Features/Community/Inventory/CInventory";
import {type MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/RequestData";

export default class FEquipProfileItems extends Feature<CInventory> {

    override checkPrerequisites(): boolean {
        return this.context.myInventory;
    }

    override apply(): void{
        this.context.onMarketInfo.subscribe(e => this.callback(e.data));
    }

    private callback(marketInfo: MarketInfo): void {
        const {view, assetId, appid, itemType} = marketInfo;

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

        const btn = <HTMLAnchorElement>HTML.toElement(
            `<a class="btn_small btn_darkblue_white_innerfade">
                <span>${L(__equipOnProfile)}</span>
            </a>`
        );

        if (itemType === "profilebackground") {
            document.getElementById(`iteminfo${view}_item_actions`)?.append(btn);
        } else {
            document.getElementById(`iteminfo${view}_item_owner_actions`)?.replaceChildren(btn);
        }

        // TODO Add checkbox so users can set equip options for the background through /IPlayerService/SetEquippedProfileItemFlags/
        btn.addEventListener("click", async e => {
            e.preventDefault();

            if (btn.classList.contains("es_equip_loading") || btn.classList.contains("btn_disabled")) { return; }
            btn.classList.add("es_equip_loading");

            /*
             * Note: For duplicate items, assetId won't be the same, and the /IPlayerService/GetProfileItemsOwned/ endpoint
             * will only return one of them (the first one obtained maybe?), but any of them will work for equipping.
             */
            const data = {"communityitemid": assetId};

            if (itemType === "profilemodifier") {
                Object.assign(data, {appid, "activate": true});
            }

            try {
                const token = await this.context.user.getWebApiToken();
                await RequestData.post(`https://api.steampowered.com${apiPath}?access_token=${token}`, data, {"credentials": "omit"});

                btn.classList.add("btn_disabled");
            } catch (err) {
                console.error("Failed to equip selected item", err);
            } finally {
                btn.classList.remove("es_equip_loading");
            }
        });
    }
}
