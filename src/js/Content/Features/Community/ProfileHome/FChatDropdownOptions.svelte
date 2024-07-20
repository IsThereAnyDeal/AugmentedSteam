<script lang="ts">
    import {__steamClientChat, __webBrowserChat} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import SteamFacade from "@Content/Modules/Facades/SteamFacade";
    import {onMount} from "svelte";

    export let sendButton: HTMLElement;
    export let steamid: string;
    export let accountid: number;

    function openSteamChat() {
        window.location.assign(`steam://friends/message/${steamid}`);
    }

    function openWebChat() {
        SteamFacade.openFriendChatInWebChat(steamid, accountid);
    }

    function showMenu() {
        SteamFacade.showMenu("profile_chat_btn", "profile_chat_dropdown", "right");
    }

    function hideMenu() {
        SteamFacade.hideMenu("profile_chat_btn", "profile_chat_dropdown");
    }

    onMount(() => sendButton.remove());
</script>


<!--
 This feature largely relies on Steam styling, so certain a11y warnings have been disabled.
-->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<span class="btn_profile_action btn_medium" id="profile_chat_btn" on:click={showMenu} tabindex="0" role="button">
    <span>
        {sendButton.textContent}
        <img src="//community.cloudflare.steamstatic.com/public/images/profile/profile_action_dropdown.png" alt="Arrow">
    </span>
</span>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="popup_block" id="profile_chat_dropdown" on:click={hideMenu} tabindex="0" role="button">
    <div class="popup_body popup_menu shadow_content">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="popup_menu_item" on:click={openWebChat} tabindex="0" role="button">
            <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/icon_btn_comment.png" alt="Chat">
            &nbsp; {L(__webBrowserChat)}
        </div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="popup_menu_item" on:click={openSteamChat} tabindex="0" role="button">
            <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/icon_btn_comment.png" alt="Chat">
            &nbsp; {L(__steamClientChat)}
        </div>
    </div>
</div>


<style>
    #profile_chat_dropdown {
        display: none;
    }
    #profile_chat_dropdown .shadow_content {
        box-shadow: 0 0 12px #000;
    }
    #profile_chat_dropdown .popup_menu_item img {
        position: relative;
        top: 3px;
    }
</style>
