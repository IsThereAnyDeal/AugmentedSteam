<script lang="ts">
    import {__inviteFriends} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";

    export let groupId: string;
</script>


<div class="grouppage_join_area">
    <a class="btn_blue_white_innerfade btn_medium" href="https://steamcommunity.com/my/friends/?invitegid={groupId}">
        <span><img src="//community.cloudflare.steamstatic.com/public/images/groups/icon_invitefriends.png" alt="Invite Icon">&nbsp; {L(__inviteFriends)}</span>
    </a>
</div>
