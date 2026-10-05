<script lang="ts">
    import { run } from 'svelte/legacy';

    import {__equipOnProfile, __saved, __saving} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import ServiceFactory from "@Protobufs/ServiceFactory";
    import type UserInterface from "@Core/User/UserInterface";
    import type {MarketInfo} from "@Content/Features/Community/Inventory/CInventory";
    import LoadingElement from "@Content/Features/Common/LoadingElement.svelte";

    interface Props {
        user: UserInterface;
        marketInfo: MarketInfo;
    }

    let { user, marketInfo }: Props = $props();

    let assetId: string = $state();
    let appid: number = $state();
    let itemType: string = $state();
    let saving: boolean = $state();
    let equipped: boolean = $state();

    async function onclick(e: Event): Promise<void> {
        e.preventDefault();

        if (saving || equipped) { return; }
        saving = true;

        try {
            if (itemType === "profilemodifier") {
                const quest = ServiceFactory.QuestService(user);
                await quest.activateProfileModifierItem({
                    communityitemid: Number(assetId),
                    appid,
                    activate: true
                })
            } else {
                /*
                 * Note: For duplicate items, assetId won't be the same, and the /IPlayerService/GetProfileItemsOwned/ endpoint
                 * will only return one of them (the first one obtained maybe?), but any of them will work for equipping.
                 */
                const data = {"communityitemid": Number(assetId)};

                const player = ServiceFactory.PlayerService(user);
                switch (itemType) {
                    case "profilebackground":     await player.setProfileBackground(data);     break;
                    case "miniprofilebackground": await player.setMiniProfileBackground(data); break;
                    case "avatarframe":           await player.setAvatarFrame(data);           break;
                    case "animatedavatar":        await player.setAnimatedAvatar(data);        break;
                    case "keyboardskin":          await player.setSteamDeckKeyboardSkin(data); break;
                }
            }

            equipped = true;
        } catch (err) {
            console.error("Failed to equip selected item", err);
        } finally {
            saving = false;
        }
    }

    // TODO check the current item is not equipped?
    // const player = ServiceFactory.PlayerService(user);
    // const equipped = await player.getProfileItemsEquipped({steamid: Long.fromString(user.steamId), language: "en"});

    run(() => {
        marketInfo;
        assetId = marketInfo.assetId;
        appid = marketInfo.appid;
        itemType = marketInfo.itemType;

        saving = false;
        equipped = false;
    });
</script>


<div>
    {#if saving}
        <LoadingElement>{L(__saving)}</LoadingElement>
    {:else if equipped}
        {L(__saved)}
    {:else}
        <button type="button" class="as-inv-btn as-blue" {onclick}>
            {L(__equipOnProfile)}
        </button>
    {/if}
</div>
