<script lang="ts">
    import {__groups_manageGroups} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import {MessageHandler} from "@Content/Modules/Messaging/MessageHandler";
    import Messenger from "@Content/Modules/Messaging/Messenger";

    function onclick() {
        Messenger.call(MessageHandler.GroupsManager, "toggleManageFriends");
    }
</script>


<button id="manage_friends_control" class="profile_friends manage_link btnv6_blue_hoverfade btn_medium btn_uppercase" {onclick}>
    <span>{L(__groups_manageGroups)}</span>
</button>